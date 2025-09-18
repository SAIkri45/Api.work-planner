import { Hono } from "hono";

import TasksController from "../controllers/taskControllers.js";
import { isAuthorized, isManagerOrAdmin } from "../middlewares/isAuthorized.js";

const taskRoutes = new Hono();
const tasksController = new TasksController();

taskRoutes.get("/status/counts", tasksController.getTaskStatusCounts);
taskRoutes.patch("/:id/status", isManagerOrAdmin, tasksController.updateTaskStatus);
taskRoutes.get("/:id", isAuthorized, tasksController.getTaskById);
taskRoutes.patch("/:id", isManagerOrAdmin, tasksController.editTask);
taskRoutes.get("/", isAuthorized, tasksController.getPaginatedTasks);

export default taskRoutes;
