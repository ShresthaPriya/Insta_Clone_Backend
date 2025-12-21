import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { verifyAccessToken, TokenPayload } from "../utils/token";

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const validateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, userName: true },
    });

    if (!user) return res.status(401).json({ message: "User does not exist" });

    req.user = { id: user.id, userName: user.userName };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
