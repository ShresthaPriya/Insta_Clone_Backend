import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  getMyNotifications,
  markAsRead,
} from "../services/notification.service";

export const getNotificationsController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const notifications = await getMyNotifications(req.user!.id);
    res.status(200).json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

export const markNotificationsReadController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const result = await markAsRead(req.user!.id);
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update notifications" });
  }
};
