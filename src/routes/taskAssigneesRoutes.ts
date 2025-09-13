import { Hono } from "hono";

import { TaskAssigneesController } from "../controllers/taskAssigneesController.js";
import { isAuthorized, isManagerOrAdmin } from "../middlewares/isAuthorized.js";

const taskAssigneesRoutes = new Hono();
const taskAssigneesController = new TaskAssigneesController();

// taskAssigneesRoutes.delete("/:id/assignees", taskAssigneesController.deleteTaskAssignee);
taskAssigneesRoutes.delete("/:id/assignees", taskAssigneesController.removeAssigneesByTaskId);
taskAssigneesRoutes.delete("/:id", taskAssigneesController.deleteTask);
taskAssigneesRoutes.get("/:id", taskAssigneesController.getTasksByProjectId);
taskAssigneesRoutes.get("/:id/users", taskAssigneesController.getAssigneesByTaskId);
// taskAssigneesRoutes.get("/:id/taskassignees",taskAssigneesController.getTaskAssignees);
taskAssigneesRoutes.post("/:id/assignees", taskAssigneesController.addUsersToTask);
taskAssigneesRoutes.post("/", isManagerOrAdmin, isAuthorized, taskAssigneesController.createTask);
// taskAssigneesRoutes.post("/", taskAssigneesController.createTask);

export default taskAssigneesRoutes;
