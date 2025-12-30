import { register } from "module";
import {z} from "zod";

export const registerSchema = z.object({
    fullName: z.string().min(3, "Fullname must be at least 3 characters long"),
    userName: z.string().min(3, "Username must be at least 3 characters long"),
    // email: z.string().email("Invalid email address"),
    phoneNumber: z.string().regex(/^(98|97|91)\d{8}$/).length(10),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    phoneVerified: z.boolean()
});
export type registerValidatorType = z.infer<typeof registerSchema>;

export const loginSchema = z.object({

    phoneNumber: z.string().regex(/^(98|97|91)\d{8}$/).length(10),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    // phoneVarified: z.boolean()

});
export type loginValidatorType = z.infer<typeof loginSchema>;

export const profileSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters").optional(),
  userName: z.string().min(3, "Username must be at least 3 characters").optional(),
  bio: z.string().max(200, "Bio must be at most 200 characters").optional(),
  email: z.string().email("Invalid email address").optional(),
  phoneNumber: z
    .string()
    .regex(/^(98|97|91)\d{8}$/, "Invalid phone number")
    .length(10)
    .optional(),
  gender: z.enum(["Male", "Female", "Prefer not to say"]).optional(),
  isPrivate: z.boolean().optional(),

  // user_profile: z.string().url("Invalid URL").optional(),
});

export type ProfileValidatorType = z.infer<typeof profileSchema>;

