import userRoute from "./user.route";
import otpRoute from "./otp.route";
import { Router } from "express";

const router = Router();

router.use("/user", userRoute);
router.use("/otp", otpRoute)

export default router;