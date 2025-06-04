import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// Extend Express.Request to include `user`
declare global {
  namespace Express {
    interface Request {
      user?: { userId: number; role: string; email: string };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Missing or invalid Authorization" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "please_replace_this"
    ) as {
      userId: number;
      role: string;
      email: string;
    };
    req.user = {
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
    };
    next();
  } catch (err) {
    console.error("JWT verify failed:", err);

    return res.status(401).json({ message: "Unauthorized" });
  }
}
