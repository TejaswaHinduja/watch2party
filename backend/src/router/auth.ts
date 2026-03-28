/*import { Router } from "express";
import { prisma }from "../../prisma/index"
import bcrypt from "bcrypt";
import gentoken from "../middleware/jwt.js";
import { AuthReq } from "../middleware/potect.js";
const authrouter=Router()

authrouter.post("/signup",async (req,res)=>{
    try{
    const {email,password,role}=req.body;
    if(!email || !password ||!role){
        return res.status(403).json({message:"fill all the fields"})
    }
    const exisitinguser=await prisma.user.findUnique({
        where:{email}
    })  
    if(exisitinguser){
        return res.status(403).json({message:"please log in"})
    }
    const hashpassword=await bcrypt.hash(password,19)
    const newuser=await prisma.user.create({
            data:{
            email:email,
            password:hashpassword,
            role
        }})
    gentoken(newuser.id,res)
    return res.status(201).json({
        message:"Signed Up!",
        id:newuser.id,
        role:newuser.role
    })
    }catch(e){
        console.log("error",e)
        return res.status(500).json({ message: "Error during signup" })
    }
})

authrouter.post("/login",async (req,res)=>{
    const {email,password}=req.body
    if(!email || !password){
        return
    }
    const checkDb=await prisma.user.findUnique({
        where:{email},
        select:{
            password:true,
            role:true,
            id:true
        }
    })
    
    if(!checkDb){
        return 
    }
    const userId=checkDb.id
    const comparepass=bcrypt.compare(checkDb?.password,password);
    if(!comparepass){
        return 
    }
    gentoken(userId,res)
    return res.json({
        message:"logged in",
        role:checkDb.role,
        
    }).status(200);
})

export default authrouter */