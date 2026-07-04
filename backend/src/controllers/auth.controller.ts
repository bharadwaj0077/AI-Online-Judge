import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AuthService } from "../services/auth.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

// Define strict validation structures for request streams
export const registerSchema = z.object({
  username: z.string().min(3, "Username must contain at least 3 characters").max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain alphanumeric keys and underscores"),
  email: z.string().email("Invalid email structure"),
  password: z.string().min(8, "Password must contain at least 8 elements"),
  fullName: z.string().max(100).optional(),
});

// 🟩 FLEXIBLE IDENTIFIER SCHEMA: Accept email or username strings seamlessly
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
      // 1. Parse and validate the incoming identity fields cleanly via Zod
      const validatedBody = loginSchema.parse(req.body);

      // 2. Pass credentials down to the service layer.
      // We map the generic 'identifier' to the 'username' key so your existing
      // AuthService logic receives the identifier string without breaking method signatures.
      const { user, token } = await AuthService.loginUser({
        username: validatedBody.identifier,
        password: validatedBody.password
      });

      // 3. Append authorization keys directly within HttpOnly cookies to block XSS vector access
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

  /**
   * GET /api/v1/auth/me
   * Resolves the currently authenticated session user profile state values
   */
  static getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: "Session unauthenticated." });
        return;
      }

      // Safe access using values verified inside your existing authentication middleware layer
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