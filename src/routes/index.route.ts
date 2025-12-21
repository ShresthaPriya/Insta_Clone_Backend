import userRoute from "./user.route";
import otpRoute from "./otp.route";
import postRoute from "./post.route";
import refreshRoute from "./refresh.route";
import filesRoute from "./files.route"

import { Router } from "express";

const router = Router();

router.use("/user", userRoute);
router.use("/otp", otpRoute);
router.use("/posts", postRoute);
router.use("/refresh-token", refreshRoute);
router.use("/files", filesRoute);



export default router;
