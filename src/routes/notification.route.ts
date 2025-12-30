import { Router } from "express";
import { validateToken } from "../middleware/auth";
import {
  getNotificationsController,
  markNotificationsReadController,
} from "../controller/notification.controller";

const router = Router();

router.get("/", validateToken, getNotificationsController);
router.patch("/read", validateToken, markNotificationsReadController);

export default router;
