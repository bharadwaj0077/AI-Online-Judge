import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

// Define a type-safe structure for decoded token payloads
export interface TokenPayload {
  id: string;
  publicId: string;
  role: "USER" | "ADMIN" | "MODERATOR";
}

// Extend the standard Express Request type to carry the authenticated user data
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

    // Verify token validity against your signature key
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    
    // Attach the user identity payload directly onto the request stream
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