import { Hono } from "hono";
import {TaskAssigneesController} from "../controllers/taskAssigneesController";
import { isEmployeAuthorized } from "../middlewares/slackMiddlewares.js";


const taskAssigneesRoutes = new Hono();
const taskAssigneesController = new TaskAssigneesController();

// taskAssigneesRoutes.delete("/:id/assignees", taskAssigneesController.deleteTaskAssignee);
taskAssigneesRoutes.delete("/:id/assignees", taskAssigneesController.removeAssigneesByTaskId);
taskAssigneesRoutes.delete("/:id", taskAssigneesController.deleteTask);
taskAssigneesRoutes.get("/:id", taskAssigneesController.getTasksByProjectId);
taskAssigneesRoutes.get("/:id/users", taskAssigneesController.getAssigneesByTaskId);
// taskAssigneesRoutes.get("/:id/taskassignees",taskAssigneesController.getTaskAssignees);
taskAssigneesRoutes.post("/:id/assignees", taskAssigneesController.addUsersToTask);
taskAssigneesRoutes.post("/", isEmployeAuthorized, taskAssigneesController.createTask);


export default taskAssigneesRoutes;