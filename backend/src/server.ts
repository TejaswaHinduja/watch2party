import express from "express"
import cors from 'cors'
import { createServer } from 'node:http';
import todorouter from "./router/room.js";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { SetSocket } from "./ws/handle.js";

const app=express();
const httpserver=createServer(app)
const io=new Server(httpserver,{
    cors:{
        origin:"http://localhost:3000",
        methods:["GET","POST"]
    }
})
SetSocket(io)
app.use(express.json())
app.use(cors({
    origin:"http://localhost:3000",
    credentials:true
}))
app.use(cookieParser());

app.use('/api',todorouter)

httpserver.listen(4000,()=>{
    console.log("server started")
})