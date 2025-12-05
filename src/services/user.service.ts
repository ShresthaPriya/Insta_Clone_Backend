import { prisma } from "../lib/prisma"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { registerValidatorType, loginValidatorType} from "../validator/user.validator"
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/token";

export const RegisterUser = async (data: registerValidatorType) => {

    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { phoneNumber: data.phoneNumber },
                { userName: data.userName }
            ]
        }
    });

    if (existingUser) {
        return { success: false, message: "User already exists" };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    try {
        const newUser = await prisma.user.create({
            data: {
                fullName: data.fullName,
                userName: data.userName,
                phoneNumber: data.phoneNumber,
                password: hashedPassword,
                phoneVerified:true,
            },
        });

        return { success: true, user: newUser };

    } catch (err) {
        console.log("Error creating user:", err);
        throw err;
    }
};

export const UserLogin =async(data: loginValidatorType)=>{
    const { phoneNumber, password} = data;

    const user = await prisma.user.findUnique({
        where: {phoneNumber},
    });


    //user exists? Check
    if(!user){
        return{
            success: false, message: "Invalid credentials."
        };
    }

//     //is phone varified? check
//     if (!user.phoneVerified) {
//     return { success: false, message: "Phone number not verified." };
//   }

    const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    return { success: false, message: "Invalid credentials." };
  }


  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  return {
    success: true,
    message: "Login successful.",
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      userName: user.userName,
      phoneNumber: user.phoneNumber,
    },
  };
};




  

