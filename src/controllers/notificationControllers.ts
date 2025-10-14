import type { Context } from "hono";

import { getNotificationsForUser } from "../services/db/notificationServices.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { User } from "../db/schema/users.js";
import { getPaginationData } from "../helpers/paginationHelper.js";
import { getSingleRecordByAColumnValue, getSingleRecordByMultipleColumnValues, updateRecordByColumnValue, updateRecordById } from "../services/db/baseDbService.js";
import { Notifications, notifications, NotificationTable } from "../db/schema/notification.js";

class NotificationController {
  getNotifications = async (c: Context) => {
    const user:User = c.get("user_payload");
    const page = +(c.req.query("page") || 1); 
    const limit = +(c.req.query("limit") || 10);
    const { records, total } = await getNotificationsForUser(user.id,page,limit);
    const pagination_records = getPaginationData(page, limit, total);
    const result = {  pagination_records,records };
    return sendSuccessResp(c, 200, "NOTIFICATIONS_FETCHED_SUCCESSFULLY", result);
  };

  isNotificationRead = async (c: Context) => {
    const user:User = c.get("user_payload");
    const notificationId = +c.req.param("id");  
    if (!notificationId) {
      throw new Error("Notification id is required");
    }
    const notification = await getSingleRecordByMultipleColumnValues<Notifications>(notifications,["id", "user_id"], [notificationId, user.id],["id"]);
    if (!notification) {
      throw new Error("Notification not found");
    }
     await updateRecordById(notifications, notificationId, { is_marked: true });
    return sendSuccessResp(c, 200, "NOTIFICATION_MARKED_AS_READ");
  };
  

}

  

export default NotificationController;
