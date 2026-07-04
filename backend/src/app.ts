import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { errorHandler } from "./middlewares/error.middleware";
import authRoutes from "./routes/auth.routes";
import problemRoutes from "./routes/problem.routes"; 
import judgeRoutes from "./routes/judge.routes"; 
import submissionRoutes from "./routes/submission.routes";
import aiRoutes from "./routes/ai.routes";
import userRoutes from "./routes/user.routes";

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
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/problems", problemRoutes); 
app.use("/api/v1/judge", judgeRoutes); 
app.use("/api/v1/submissions", submissionRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/users", userRoutes);

// Global API Version Base Entry Route
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ success: true, message: "Online Judge Engine Gateway Live." });
});

// Global Fallback Error Middleware Handler
// 🟩 UNIFIED CORS OBJECT: Explicitly trust your exact browser local domain
app.use(
  cors({ 
    origin: "http://localhost:3000", 
    credentials: true 
  })
);
export default app;