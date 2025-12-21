import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from "../utils/token";

export const RefreshTokenController = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "Refresh token required" });

    const decoded = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, userName: true },
    });

    if (!user) return res.status(401).json({ message: "User does not exist" });

    const newAccessToken = generateAccessToken({ id: user.id, userName: user.userName });
    const newRefreshToken = generateRefreshToken({ id: user.id, userName: user.userName });

    res.status(200).json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};
