import { Hono } from "hono";
import { isAuthorized } from "../middlewares/isAuthorized.js";
import NotificationController from "../controllers/notificationControllers.js";

const notificationRoute = new Hono();
const notificationController = new NotificationController();


notificationRoute.get("/", isAuthorized, notificationController.getNotifications);

export default notificationRoute