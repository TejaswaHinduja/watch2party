import { METHODS } from "http";
import { useState,useEffect } from "react";


export function Chat(){
    async function getChats (){
    const res=await fetch("http://localhost:5000/chat",{
        method:"GET",
        headers:{"Content-type":"application/json"}
    }
    )
}
    return <div>

    </div>
}