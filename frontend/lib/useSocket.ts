'use client';
import { useEffect, useState } from 'react';
import { getSocket } from '../lib/socket';

export type VideoState = {
  videoId:string | null;
  playState:'playing' | 'paused';
  currentTime: number;
};
type Participant = {
  id: string;
  username: string;
  role: "HOST" | "PARTICIPANT";
};


export function useSocket(roomCode: string, username: string) {
  const socket = getSocket();

  const [participants,setParticipants]=useState<Participant[]>([]);
  const [videoState,setVideoState]= useState<VideoState | null>(null);
  const [socketId, setSocketId] = useState<string | undefined>(undefined);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [kickedMessage, setKickedMessage] = useState<string | null>(null);
  

  useEffect(() => {
    if (!username || !roomCode || roomCode === "undefined") {
      console.log("[useSocket] skip connect: missing roomCode/username", { roomCode, username });
      return;
    }

    console.log("[useSocket] setup", {
      roomCode,
      username,
      connected: socket.connected,
      socketId: socket.id,
    });

    const onConnect = () => {
      setSocketId(socket.id);
      console.log("[socket] connected", { socketId: socket.id, roomCode, username });
    };

    const onDisconnect = (reason: string) => {
      setSocketId(undefined);
      console.log("[socket] disconnected", { reason, roomCode, username });
    };

    const onSyncState = (state: VideoState) => {
      console.log("[socket] sync_state", state);
      setVideoState(state);
    };

    const onUsersChanged = (payload: Participant[] | { users: Participant[] }) => {
      console.log("[socket] user_joined raw payload", payload);
      if (Array.isArray(payload)) {
        console.log("[socket] user_joined normalized participants", payload);
        setParticipants(payload);
        return;
      }
      const nextParticipants = payload.users ?? [];
      console.log("[socket] user_joined normalized participants", nextParticipants);
      setParticipants(nextParticipants);
    };

    const onRoomError = (payload: { message?: string }) => {
      const message = payload?.message ?? "Unknown room error";
      console.log("[socket] room_error", message);
      setRoomError(message);
    };

    const onKicked = (payload: { message?: string }) => {
      const message = payload?.message ?? "You were removed from this room.";
      console.log("[socket] kicked", message);
      setKickedMessage(message);
      socket.disconnect();
    };

    setRoomError(null);
    setKickedMessage(null);
    socket.connect();
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("sync_state", onSyncState);
    socket.on("user_joined", onUsersChanged);
    socket.on("room_error", onRoomError);
    socket.on("kicked", onKicked);
    console.log("[socket] emitting join_room", { roomCode, username });
    socket.emit("join_room", { roomCode, username });

    return ()=>{
      console.log("[socket] cleanup", { roomCode, username, socketId: socket.id });
      socket.emit("leave_room",{roomCode});
        socket.off("connect", onConnect)
        socket.off("disconnect", onDisconnect)
        socket.off("sync_state", onSyncState)
        socket.off("user_joined", onUsersChanged)
        socket.off("room_error", onRoomError)
        socket.off("kicked", onKicked)
        socket.disconnect()
    }},[roomCode,username])

    useEffect(() => {
      console.log("[useSocket] participants state updated", participants);
    }, [participants]);

    useEffect(() => {
      console.log("[useSocket] videoState updated", videoState);
    }, [videoState]);

    const play=()=>socket.emit("play");
    const pause=()=>socket.emit("pause");
    const seek=(time:number)=>socket.emit("seek",{time});
    const promoteParticipant=(participantId:string)=>socket.emit("promote_participant",{participantId});
    const kickParticipant=(participantId:string)=>socket.emit("kick_participant",{participantId});

    const myParticipant = participants.find((p) => p.id === socketId);
    const isHost = myParticipant?.role === "HOST";

    return  {
      videoState,
      participants,
      isHost,
      roomError,
      kickedMessage,
      play,
      pause,
      seek,
      promoteParticipant,
      kickParticipant
    };
}