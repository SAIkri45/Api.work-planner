import { Hono } from "hono";

import ProjectController from "../controllers/projectController.js";

const projectRouter = new Hono();
const projectControllers = new ProjectController();

projectRouter.post("/", projectControllers.createProject);
projectRouter.get("/", projectControllers.getAllProjectsPaginated);

export default projectRouter;
