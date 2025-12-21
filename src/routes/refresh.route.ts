import { Router } from "express";
import { RefreshTokenController } from "../controller/refreshToken.controller";

const router = Router();
router.post("/", RefreshTokenController);

export default router;
