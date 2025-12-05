import { Router } from "express";
import { verifyOtpController, generateOtpController } from "../controller/otp.controller";

const router = Router();
router.post("/generate-otp", generateOtpController);
router.post("/verify-otp", verifyOtpController)

export default router;