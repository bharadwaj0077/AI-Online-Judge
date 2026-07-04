import { Router } from "express";
import { AuthController, registerSchema, loginSchema } from "../controllers/auth.controller";
import { validateBody } from "../middlewares/validation.middleware";
import { requireAuth } from "../middlewares/auth.middleware";
const router = Router();

router.post("/register", validateBody(registerSchema), AuthController.register);
router.post("/login", validateBody(loginSchema), AuthController.login);
router.post("/logout", AuthController.logout);
router.get("/me", requireAuth, AuthController.getMe);
export default router;