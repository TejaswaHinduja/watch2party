import jwt from "jsonwebtoken"
import  { Response } from "express"

const secret="!234ahaha"

export default function gentoken(id:string,res:Response){
    const token=jwt.sign({id},secret,{
        expiresIn:"7D"
    })
    res.cookie("jwt",token,{
        maxAge:7*24*60*60*1000,
        httpOnly:true,
        sameSite:"lax",
        secure:false
    })
    return token;
}