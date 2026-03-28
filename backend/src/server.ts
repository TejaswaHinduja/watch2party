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
        origin:["http://localhost:3000","https://watch2party-ten.vercel.app"],
        methods:["GET","POST"]
    }
})
SetSocket(io)
app.use(express.json())
app.use(cors({
    origin:["http://localhost:3000","https://watch2party-ten.vercel.app"],
    credentials:true
}))
app.use(cookieParser());

app.use('/api',todorouter)

const PORT = Number(process.env.PORT ?? 4000)

httpserver.listen(PORT,()=>{
    console.log(`server started on ${PORT}`)
})