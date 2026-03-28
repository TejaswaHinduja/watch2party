/*import jwt, { JwtPayload } from "jsonwebtoken"
import { Response,Request,NextFunction } from "express"
import { prisma }from "../../prisma/index.js"
import { role } from "../../generated/prisma/enums"


const secret="!234ahaha"

type AuthUser={
    id:string,
    role:role
}
export interface AuthReq extends Request{
    user?:AuthUser
}
export async function protect(req:AuthReq,res:Response,next:NextFunction){
    const token=req.cookies.jwt;
    if(!token){
        return res.status(401).json({message:"login again,inavlid creds"})
    }
    try{
        const decoded=jwt.verify(token,secret) as JwtPayload & {id:string}
        if(!decoded.id){
            return res.status(401).json({message:"Invalid token"})
        }
        const userId=decoded.id;
        const attachuser=await prisma.user.findUnique({
            where:{id:userId},
            select:{
                id:true,
                role:true
            }
        })
        if(!attachuser){
            return res.status(403).json({message:"inavlid token"})
        }
        req.user=attachuser
        next();
    }catch(error){
        return res.status(403).json({message:"token invalid"})
    }
}*/