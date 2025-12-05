import {RegisterUser} from "../services/user.service"
import { Request, Response } from "express"
import { registerSchema } from "../validator/user.validator"

export const registerUserController = async (req:Request, res:Response) => {
    try{
        console.log(req.body);
        const data = registerSchema.parse(req.body); 
        console.log(data)
        
        const user = await RegisterUser(data);
        
        if (!user.success) {
            return res.status(409).json({
                success: false,
                message: user.message
            });
        }
        res.status(201).json({message: "User registered successfully", user});
    } catch (err){
        console.log(err);
        res.status(500).json({message: "Internal server error", error: err});
    }
}
