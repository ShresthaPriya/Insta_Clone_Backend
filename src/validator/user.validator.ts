import { register } from "module";
import {z} from "zod";

export const registerSchema = z.object({
    fullName: z.string().min(3, "Fullname must be at least 3 characters long"),
    userName: z.string().min(3, "Username must be at least 3 characters long"),
    // email: z.string().email("Invalid email address"),
    phoneNumber: z.string().regex(/^(98|97|91)\d{8}$/).length(10),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    phoneVarified: z.boolean()
});
export type registerValidatorType = z.infer<typeof registerSchema>;

export const loginSchema = z.object({

    phoneNumber: z.string().regex(/^(98|97|91)\d{8}$/).length(10),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    // phoneVarified: z.boolean()

});
export type loginValidatorType = z.infer<typeof loginSchema>;

