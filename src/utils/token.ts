import jwt from "jsonwebtoken";

export interface TokenPayload {
  id: string;
  userName: string;
}

export const generateAccessToken = (user: TokenPayload) => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: "15m" });
};

export const generateRefreshToken = (user: TokenPayload) => {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: "7d" });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as TokenPayload;
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as TokenPayload;
};
