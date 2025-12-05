import { userInfo } from 'node:os';
import {z} from 'zod';


export const generateOtpScema = z.object({
    phoneNumber: z.string().min(10, "Phone number must be of 10 digits").regex(/^(98|97|91)\d{8}$/),
    otp: z.string().length(6).optional(),
     userInfo: z
    .object({
      fullName: z.string(),
      userName: z.string(),
      phoneNumber: z.string(),
      password: z.string(),
    })
    .optional(),
});

export type otpValidatorType = z.infer<typeof generateOtpScema>