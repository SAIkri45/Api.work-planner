import { Hono } from "hono";

import NotificationController from "../controllers/notificationControllers.js";
import { isAuthorized } from "../middlewares/isAuthorized.js";

const notificationRoute = new Hono();
const notificationController = new NotificationController();



notificationRoute.get("/", isAuthorized, notificationController.getNotifications);
notificationRoute.patch("/:id", isAuthorized, notificationController.isNotificationRead);
notificationRoute.put("/mark-as-read/all", isAuthorized, notificationController.markAllNotificationsRead);
notificationRoute.get("/unread-notifications-count", isAuthorized, notificationController.countUnreadNotifications);

export default notificationRoute;
