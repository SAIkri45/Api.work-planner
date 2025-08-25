import { Hono } from "hono";
import taskControllers, {TasksController} from "../controllers/taskControllers";
const tasksController = new TasksController();
const taskRoutes = new Hono();


taskRoutes.post("/", tasksController.createTask);
taskRoutes.get("/tasklist", tasksController.getPaginatedTasks);
taskRoutes.get("/:id", tasksController.getTaskById);

export default taskRoutes;