import { Hono } from "hono";
import { isAuthorized } from "../middlewares/isAuthorized.js";
import { ChatController } from "../controllers/chatControllers.js";

const chatControllers = new ChatController();


export const chatRoutes = new Hono();
chatRoutes.post("/", isAuthorized, chatControllers.createChat);
