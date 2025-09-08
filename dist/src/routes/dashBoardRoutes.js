import { Hono } from "hono";
import DashBoardController from "../controllers/dashBoardController.js";
const dashBoardController = new DashBoardController();
const dashBoardRoutes = new Hono();
dashBoardRoutes.get("/status", dashBoardController.getDashboardStatus);
dashBoardRoutes.get("/statistics", dashBoardController.overAllStatistics);
dashBoardRoutes.get("/today-tasks", dashBoardController.todayTasks);
dashBoardRoutes.get("/today-status", dashBoardController.todaysTasksStatusCount);
export default dashBoardRoutes;
