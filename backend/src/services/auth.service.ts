import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db";
import { env } from "../config/env";
import { RegisterBody, LoginBody } from "../controllers/auth.controller";

export class AuthService {
  // 1. Core Registration Logic
  static async registerUser(data: RegisterBody) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }],
        deletedAt: null,
      },
    });

    if (existingUser) {
      const field = existingUser.email === data.email ? "email" : "username";
      const error: any = new Error(`A user with this ${field} already exists.`);
      error.statusCode = 409;
      throw error;
    }

    // Securely hash plain password strings
    const passwordHash = await bcrypt.hash(data.password, 12);

    const newUser = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
        fullName: data.fullName,
      },
    });

    return newUser;
  }

  // 2. Core Login Verification Logic
  static async loginUser(data: LoginBody) {
    const user = await prisma.user.findFirst({
      where: { username: data.username, deletedAt: null },
    });

    if (!user) {
      const error: any = new Error("Invalid username or password credentials.");
      error.statusCode = 401;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      const error: any = new Error("Invalid username or password credentials.");
      error.statusCode = 401;
      throw error;
    }

    // Sign authentication verification payload tokens
    const token = jwt.sign(
      { id: user.id.toString(), publicId: user.publicId, role: user.role },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return { user, token };
  }
}