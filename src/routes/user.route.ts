import { Router } from "express";
import { registerUserController } from "../controller/user.controller";

const router = Router();
router.post("/register", registerUserController);

export default router;