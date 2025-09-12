import { Hono } from "hono";
import TasksController from "../controllers/taskControllers.js";
const taskRoutes = new Hono();
const tasksController = new TasksController();
taskRoutes.get("/status/counts", tasksController.getTaskStatusCounts);
taskRoutes.get("/:id", tasksController.getTaskById);
taskRoutes.patch("/:id", tasksController.editTask);
taskRoutes.get("/", tasksController.getPaginatedTasks);
export default taskRoutes;
