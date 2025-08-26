import { Hono } from "hono";

import ProjectController from "../controllers/projectController.js";
import { isEmployeAuthorized } from "../middlewares/slackMiddlewares.js";

const projectRouter = new Hono();
const projectControllers = new ProjectController();

projectRouter.post("/", isEmployeAuthorized, projectControllers.createProject);
projectRouter.get("/", projectControllers.getAllProjectsPaginated);
projectRouter.get("/drop-down", projectControllers.getAllProjectsDropDown);
projectRouter.patch("/:id", projectControllers.updateProject);
projectRouter.get("/:id", projectControllers.getProjectById);
projectRouter.get("/users/:project_id", projectControllers.getProjectUsersById);
projectRouter.delete("/:id", projectControllers.softDeleteProjectById);

export default projectRouter;
