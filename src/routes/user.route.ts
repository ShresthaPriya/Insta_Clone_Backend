import { Router } from "express";
import { LoginController, registerUserController } from "../controller/user.controller";

const router = Router();
router.post("/register", registerUserController);
router.post("/login", LoginController);

export default router;