import { Hono } from "hono";
import {TaskAssigneesController} from "../controllers/taskAssigneesController";
import { isEmployeAuthorized } from "../middlewares/slackMiddlewares.js";


const taskAssigneesRoutes = new Hono();
const taskAssigneesController = new TaskAssigneesController();

taskAssigneesRoutes.delete("/:id/assignees", taskAssigneesController.deleteTaskAssignees);
taskAssigneesRoutes.delete("/:id", taskAssigneesController.deleteTask);
taskAssigneesRoutes.post("/", isEmployeAuthorized, taskAssigneesController.createTask);


export default taskAssigneesRoutes;