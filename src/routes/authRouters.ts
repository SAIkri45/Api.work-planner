import { Hono } from "hono";

import { AuthController } from "../controllers/authController.js";

const authController = new AuthController();
const authRoutes = new Hono();

authRoutes.post("/signin", authController.signInWithEmail);

export default authRoutes;
