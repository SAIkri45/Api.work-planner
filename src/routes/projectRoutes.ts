import { Hono } from "hono";

import ProjectController from "../controllers/projectController.js";
import { isAuthorized, isManagerOrAdmin } from "../middlewares/isAuthorized.js";

const projectRouter = new Hono();
const projectControllers = new ProjectController();

projectRouter.get("/drop-down", isAuthorized, projectControllers.getAllProjectsDropDown);
projectRouter.get("/users", isAuthorized, projectControllers.getAllProjectUsersList);
projectRouter.get("/status", projectControllers.updateProjectStatusByCron);
projectRouter.get("/:id/users/assigned", isAuthorized, projectControllers.getProjectBasedAssignedUsers);
projectRouter.get("/:id/users/available", isAuthorized, projectControllers.getAllNonExistingUsers);
projectRouter.post("/:id/users", isManagerOrAdmin, projectControllers.assignUsersToProject);
projectRouter.delete("/:id/users", isManagerOrAdmin, projectControllers.removeUserFromProject);
// projectRouter.get("/users/:id", isAuthorized, projectControllers.getProjectUsersById);
projectRouter.patch("/:id/status", isManagerOrAdmin, projectControllers.updateProjectStatus);
projectRouter.get("/:id/tasks", isAuthorized, projectControllers.getAllTasksByProjectId);
projectRouter.get("/:id/tasks/status", projectControllers.getTasksStatusByProjectId);
projectRouter.patch("/:id", isManagerOrAdmin, projectControllers.updateProject);
projectRouter.get("/:id", isAuthorized, projectControllers.getProjectById);
projectRouter.delete("/:id", isManagerOrAdmin, projectControllers.softDeleteProjectById);
projectRouter.get("/", isAuthorized, projectControllers.getAllProjects);
projectRouter.post("/", isManagerOrAdmin, projectControllers.createProject);

export default projectRouter;
