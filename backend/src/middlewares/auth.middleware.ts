import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface TokenPayload {
  id: string;
  publicId: string;
  role: "USER" | "ADMIN" | "MODERATOR";
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

// 1. Core Gatekeeper: Enforce that a user is actively logged in
export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies.token;

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Access denied. No authentication session found.",
      });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Session expired or invalid token signature.",
    });
  }
};

// 2. Privilege Gatekeeper: Restrict access exclusively to Admin accounts
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user || req.user.role !== "ADMIN") {
    res.status(403).json({
      success: false,
      message: "Forbidden. This action requires administrative clearance privileges.",
    });
    return;
  }
  next();
};

// 3. Non-Blocking Gatekeeper: Safely reads user data for public listing views
export const optionalAuth = async (req: any, res: any, next: any) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    if (token) {
      // 🟩 FIXED: Standardized to use the type-safe configuration schema variable
      const decoded = jwt.verify(token, env.JWT_SECRET) as any; 
      req.user = decoded; 
    }
    next(); 
  } catch (error) {
    next(); 
  }
};