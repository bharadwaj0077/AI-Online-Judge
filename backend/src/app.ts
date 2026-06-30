import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/error.middleware";
import authRoutes from "./routes/auth.routes"; // <-- Add this line

const app = express();

// Security Boundary & Utility Middlewares
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Register Functional Application Endpoint Hierarchies
app.use("/api/v1/auth", authRoutes); // <-- Add this line

// Global API Version Base Entry Route
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ success: true, message: "CodeForge Engine Gateway Live." });
});

// Global Fallback Error Middleware Handler
app.use(errorHandler);

export default app;