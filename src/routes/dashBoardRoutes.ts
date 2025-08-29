import { Hono } from "hono";

import DashBoardController from "../controllers/dashBoardController.js";

const dashBoardController = new DashBoardController();
const dashBoardRoutes = new Hono();

dashBoardRoutes.get("/status", dashBoardController.getDashboardStatus);

export default dashBoardRoutes;
