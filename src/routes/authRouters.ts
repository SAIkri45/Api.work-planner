import { Hono } from "hono";

import { AuthController } from "../controllers/authController.js";

const authController = new AuthController();
const authRoutes = new Hono();

authRoutes.post("/login", authController.signInWithEmail);

export default authRoutes;
