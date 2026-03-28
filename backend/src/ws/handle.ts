import { Server, Socket } from 'socket.io';
import { prisma }from "../../prisma/index"

type Participant = {
    id: string;
    username: string;
    role: "HOST" | "PARTICIPANT";
};

type RoomState = {
    participants: Participant[];
    videoState: {
        videoId: string | null;
        playState: string;
        currentTime: number;
    };
};

const rooms = new Map<string, RoomState>();

export function SetSocket(io:Server){
    const normalizeRoomCode = (value: unknown) => String(value ?? "").trim();

    const findInMemoryRoomCode = (roomCode: string) => {
        const normalized = roomCode.toLowerCase();
        return [...rooms.keys()].find((existingCode) => existingCode.toLowerCase() === normalized);
    };

    const getSocketRoomCode = (socket: Socket) => {
        return [...socket.rooms].find((roomCode) => roomCode !== socket.id);
    };

    const emitParticipants = (roomCode: string, room: RoomState) => {
        io.to(roomCode).emit("user_joined", room.participants);
    };

    const removeParticipantFromRoom = (roomCode: string, socketId: string) => {
        const room = rooms.get(roomCode);
        if (!room) return;

        room.participants = room.participants.filter((participant) => participant.id !== socketId);

        if (room.participants.length === 0) {
            rooms.delete(roomCode);
            return;
        }

        const hasHost = room.participants.some((participant) => participant.role === "HOST");
        if (!hasHost) {
            const firstParticipant = room.participants[0];
            if (firstParticipant) {
                firstParticipant.role = "HOST";
            }
        }

        emitParticipants(roomCode, room);
    };

    io.on("connection",(socket)=>{
        socket.on("join_room",async ({roomCode,username})=>{
            const requestedRoomCode = normalizeRoomCode(roomCode);
            if (!requestedRoomCode) {
                return socket.emit("room_error",{message:"Room code is required"})
            }

            const inMemoryRoomCode = findInMemoryRoomCode(requestedRoomCode);
            const resolvedRoomCode = inMemoryRoomCode ?? requestedRoomCode;

            let room=rooms.get(resolvedRoomCode);
            let joinedRoomCode = resolvedRoomCode;
            if(!room){
                const checkDb=await prisma.room.findFirst({
                    where:{
                        code: {
                            equals: requestedRoomCode,
                            mode: "insensitive"
                        }
                    }
                })
                if(!checkDb){
                    return socket.emit("room_error",{message:"Room not found"})
                }
                joinedRoomCode = checkDb.code;
                room={
                participants:[],
                videoState:{
                    videoId:checkDb.videoId,
                    playState:checkDb.playState,
                    currentTime:checkDb.currentTime
                },
            }
            rooms.set(joinedRoomCode,room)
            }
            const isFirst=room.participants.length===0;
            const user: Participant = {
                id:socket.id,
                username: String(username ?? ""),
                role:isFirst?"HOST":"PARTICIPANT"
            }
            room.participants.push(user);
            socket.join(joinedRoomCode);
            socket.emit("sync_state",room.videoState);
            emitParticipants(joinedRoomCode, room);
            console.log("ROOM PARTICIPANTS:", room.participants);
        })
        socket.on("leave_room", ({ roomCode }) => {
            const requestedRoomCode = normalizeRoomCode(roomCode);
            if (!requestedRoomCode) return;
            const resolvedRoomCode = findInMemoryRoomCode(requestedRoomCode) ?? requestedRoomCode;
            socket.leave(resolvedRoomCode);
            removeParticipantFromRoom(resolvedRoomCode, socket.id);
        });
        socket.on("play",()=>{
            const roomId=getSocketRoomCode(socket);
            if(!roomId){
                return
            }
            const room=rooms.get(roomId)
            if(!room){
                return
            }
            const user=room.participants.find(p=>p.id===socket.id);
            if(user?.role!=="HOST")return;
            room.videoState.playState="playing";
            io.to(roomId).emit("sync_state",room.videoState)
        })
        socket.on("pause",()=>{
            const roomId=getSocketRoomCode(socket);
            if(!roomId){
                return
            }
            const room=rooms.get(roomId)
            if(!room){
                return
            }
            const user=room.participants.find(p=>p.id===socket.id);
            if(user?.role!=="HOST")return;
            room.videoState.playState="paused";
            io.to(roomId).emit("sync_state",room.videoState)
        })
        socket.on("seek",({time})=>{
            const roomId=getSocketRoomCode(socket);
            if(!roomId){
                return
            }
            const room=rooms.get(roomId)
            if(!room){
                return
            }
            const user=room.participants.find(p=>p.id===socket.id);
            if(user?.role!=="HOST")return;
            room.videoState.currentTime=time;
            io.to(roomId).emit("sync_state",room.videoState)
        })
        socket.on("promote_participant",({participantId})=>{
            const roomCode=getSocketRoomCode(socket);
            if(!roomCode){
                return
            }
            const room=rooms.get(roomCode)
            if(!room){
                return
            }

            const requester=room.participants.find((p)=>p.id===socket.id)
            if(requester?.role!=="HOST"){
                return
            }

            const target=room.participants.find((p)=>p.id===participantId)
            if(!target || target.id===socket.id){
                return
            }

            room.participants=room.participants.map((participant)=>({
                ...participant,
                role: participant.id===target.id ? "HOST" : "PARTICIPANT"
            }))

            emitParticipants(roomCode, room)
        })
        socket.on("kick_participant",({participantId})=>{
            const roomCode=getSocketRoomCode(socket);
            if(!roomCode){
                return
            }
            const room=rooms.get(roomCode)
            if(!room){
                return
            }

            const requester=room.participants.find((p)=>p.id===socket.id)
            if(requester?.role!=="HOST"){
                return
            }

            const target=room.participants.find((p)=>p.id===participantId)
            if(!target || target.id===socket.id){
                return
            }

            io.to(target.id).emit("kicked",{roomCode,message:"You were removed by the host."})
            const targetSocket=io.sockets.sockets.get(target.id)
            targetSocket?.leave(roomCode)
            removeParticipantFromRoom(roomCode, target.id)
        })
        socket.on("disconnecting", () => {
            const joinedRooms = [...socket.rooms].filter((code) => code !== socket.id);
            for (const roomCode of joinedRooms) {
                removeParticipantFromRoom(roomCode, socket.id);
            }
        });

    })
}