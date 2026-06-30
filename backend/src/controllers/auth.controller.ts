import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AuthService } from "../services/auth.service";

// Define strict validation structures for request streams
export const registerSchema = z.object({
  username: z.string().min(3, "Username must contain at least 3 characters").max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain alphanumeric keys and underscores"),
  email: z.string().email("Invalid email structure"),
  password: z.string().min(8, "Password must contain at least 8 elements"),
  fullName: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
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

  // Handle User Session Authentication
  static login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user, token } = await AuthService.loginUser(req.body);

      // Append authorization keys directly within HttpOnly cookies to block XSS vector access
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // Explicit 7-day expiration lifespan window
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
}