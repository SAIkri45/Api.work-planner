import { Hono } from "hono";

import { ChatController } from "../controllers/chatControllers.js";
import { isAuthorized } from "../middlewares/isAuthorized.js";

const chatControllers = new ChatController();

export const chatRoutes = new Hono();
chatRoutes.post("/", isAuthorized, chatControllers.createChat);
chatRoutes.get("/:task_id", isAuthorized, chatControllers.getAllChats);
