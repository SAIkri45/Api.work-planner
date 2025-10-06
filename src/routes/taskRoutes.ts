import { Hono } from "hono";

import TasksController from "../controllers/taskControllers.js";
import { isAuthorized } from "../middlewares/isAuthorized.js";

const taskRoutes = new Hono();
const tasksController = new TasksController();

taskRoutes.get("/status/counts", isAuthorized, tasksController.getTaskStatusCounts);
taskRoutes.get("/weekly-summary", isAuthorized, tasksController.getWeeklySummary);
taskRoutes.patch("/:id/status", isAuthorized, tasksController.updateTaskStatus);
taskRoutes.get("/:id", isAuthorized, tasksController.getTaskById);
taskRoutes.patch("/:id", isAuthorized, tasksController.editTask);
taskRoutes.get("/", isAuthorized, tasksController.getPaginatedTasks);

export default taskRoutes;
