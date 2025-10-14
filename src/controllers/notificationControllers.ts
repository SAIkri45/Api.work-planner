import type { Context } from "hono";

import { getNotificationsForUser } from "../services/db/notificationServices.js";
import { sendSuccessResp } from "../utils/respUtils.js";

class NotificationController {
  getNotifications = async (c: Context) => {
    const user = c.get("user_payload");
    const result = await getNotificationsForUser(user.id);
    return sendSuccessResp(c, 200, "NOTIFICATIONS_FETCHED", result);
  };
}

export default NotificationController;
