import { Hono } from "hono";

import ProjectController from "../controllers/projectController.js";
import { isAuthorized } from "../middlewares/isAuthorized.js";

const projectRouter = new Hono();
const projectControllers = new ProjectController();

projectRouter.get("/drop-down", projectControllers.getAllProjectsDropDown);
projectRouter.get("/users", projectControllers.getAllProjectUsersList);
projectRouter.get("/:id/users/assigned", projectControllers.getProjectBasedAssignedUsers);
projectRouter.get("/:id/users/available", projectControllers.getAllNonExistingUsers);
projectRouter.post("/:id/users", projectControllers.assignUsersToProject);
projectRouter.delete("/:id/users", projectControllers.removeUserFromProject);
projectRouter.get("/users/:id", projectControllers.getProjectUsersById);
projectRouter.patch("/:id/status", projectControllers.updateProjectStatus);
projectRouter.get("/:id/tasks", projectControllers.getAllTasksByProjectId);
projectRouter.get("/:id/tasks/status", projectControllers.getTasksStatusByProjectId);
projectRouter.patch("/:id", isAuthorized, projectControllers.updateProject);
projectRouter.get("/:id", projectControllers.getProjectById);
projectRouter.delete("/:id", projectControllers.softDeleteProjectById);
projectRouter.get("/", projectControllers.getAllProjectsPaginated);
projectRouter.post("/", isAuthorized, projectControllers.createProject);

export default projectRouter;
