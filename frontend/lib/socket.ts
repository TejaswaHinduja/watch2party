"use client"
import {io,Socket} from "socket.io-client"

const SERVER_URL="http://localhost:4000"

let socket:Socket;
export function getSocket():Socket{
    if(!socket) socket=io(SERVER_URL,{autoConnect:false})
    return socket

}