import { Router } from "express";
import { prisma }from "../../prisma/index"

import { AuthReq } from "../middleware/potect.js";
import { customAlphabet } from "nanoid";
import ytVidId from "../utils/rgx"
const todorouter=Router();
const createRoomCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

todorouter.get("/room/:code", async (req, res) => {
        try {
        const code = String(req.params.code ?? "").trim();
        if (!code) {
            return res.status(400).json({ message: "Room code is required" });
        }

        const room = await prisma.room.findFirst({
            where: {
                code: {
                    equals: code,
                    mode: "insensitive",
                },
            },
            select: {
                code: true,
                videoId: true,
                playState: true,
                currentTime: true,
            },
        });

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        return res.status(200).json(room);
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: "Server error" });
    }
})


todorouter.post("/createroom",async(req,res)=>{
        try{
        const{videoUrl}=req.body
        if(!videoUrl){
            return res.status(400).json({message:"Please fill all fields"})
        }
        const parsedVideoId = ytVidId(videoUrl)
        if(!parsedVideoId){
            return res.status(400).json({message:"enter a valid url"})
        }
        const code=createRoomCode();
        const addRoom=await prisma.room.create({
            data:{
                code,
                videoId:parsedVideoId,
                currentTime:0,
                playState:"paused"
            }
        })
        return res.status(200).json({
            roomCode:addRoom.code,
            videoId:addRoom.videoId,
        })
    }catch(e){
        console.log(e)
        return res.status(500).json({message:"Server error"})
    }
})

export default todorouter