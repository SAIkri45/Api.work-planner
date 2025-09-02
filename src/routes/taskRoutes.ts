import { Hono } from "hono";
import TasksController  from "../controllers/taskControllers.js";
import { isEmployeAuthorized } from "../middlewares/slackMiddlewares.js";

const taskRoutes = new Hono();
const tasksController = new TasksController();

taskRoutes.get("/tasklist", tasksController.getPaginatedTasks);
taskRoutes.get("/:id", tasksController.getTaskById);
taskRoutes.patch("/:id", tasksController.editTask);

export default taskRoutes;