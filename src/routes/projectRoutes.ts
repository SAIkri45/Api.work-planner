import { Hono } from "hono";

import ProjectController from "../controllers/projectController.js";
import { isEmployeAuthorized } from "../middlewares/slackMiddlewares.js";

const projectRouter = new Hono();
const projectControllers = new ProjectController();

projectRouter.get("/drop-down", projectControllers.getAllProjectsDropDown);
projectRouter.post("/:id/users", projectControllers.assignUsersToProject);
projectRouter.patch("/:id/users", projectControllers.deleteUserFromProject);
projectRouter.get("/users/:project_id", projectControllers.getProjectUsersById);
projectRouter.patch("/:id", projectControllers.updateProject);
projectRouter.get("/:id", projectControllers.getProjectById);
projectRouter.delete("/:id", projectControllers.softDeleteProjectById);
projectRouter.get("/", projectControllers.getAllProjectsPaginated);
projectRouter.post("/", isEmployeAuthorized, projectControllers.createProject);

export default projectRouter;
