import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../config/db"; // 🟩 IMPORT FIXED: Securely attaches the Prisma instance to this file scope
import { AuthService } from "../services/auth.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

// Define strict validation structures for request streams
export const registerSchema = z.object({
  username: z.string().min(3, "Username must contain at least 3 characters").max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain alphanumeric keys and underscores"),
  email: z.string().email("Invalid email structure"),
  password: z.string().min(8, "Password must contain at least 8 elements"),
  fullName: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;

export class AuthController {
  // Handle User Account Ingestion
  static register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await AuthService.registerUser(req.body);
      res.status(201).json({
        success: true,
        message: "User account identity established successfully.",
        data: { publicId: user.publicId, username: user.username, email: user.email },
      });
    } catch (error) {
      next(error);
    }
  };

  // Handle User Session Authentication (Dual Identifier Entry Enabled)
  static login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = loginSchema.parse(req.body);

      // ⚡ Scan columns to pull the actual record matching the email or username input string
      const matchedUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: validatedBody.identifier.toLowerCase().trim() },
            { username: validatedBody.identifier.trim() }
          ]
        }
      });

      // If no account exists with that email or username
      if (!matchedUser) {
        res.status(401).json({ success: false, message: "Invalid email/username or password provided." });
        return;
      }

      // Pass the verified username string down to your existing AuthService pipeline
      const { user, token } = await AuthService.loginUser({
        username: matchedUser.username,
        password: validatedBody.password
      });

      // Append authorization keys directly within HttpOnly cookies
      // In production the frontend (vercel.app) and backend (onrender.com) are
      // different sites, so the session cookie must be SameSite=None + Secure.
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        message: "Authentication handshake passed successfully.",
        data: { publicId: user.publicId, username: user.username, role: user.role },
      });
    } catch (error) {
      next(error);
    }
  };

  // Handle User Session Exits
  static logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.clearCookie("token");
    res.status(200).json({ success: true, message: "Session token terminated successfully." });
  };

  // Resolves the currently authenticated session user profile state values
  static getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Session unauthenticated." });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role
        },
      });
    } catch (error) {
      next(error);
    }
  };
}