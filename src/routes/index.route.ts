import userRoute from "./user.route";
import otpRoute from "./otp.route";
import postRoute from "./post.route";
import { Router } from "express";

const router = Router();

router.use("/user", userRoute);
router.use("/otp", otpRoute);
router.use("/posts", postRoute);

export default router;
