import { eq } from "drizzle-orm";
import { notifications } from "../db/schema/notification.js";
import { getPaginationData } from "../helpers/paginationHelper.js";
import { getRecordsConditionally, getRecordsCount, getSingleRecordByMultipleColumnValues, updateRecordById, updateRecordByMultipleColumnValues } from "../services/db/baseDbService.js";
import { getNotificationsForUser } from "../services/db/notificationServices.js";
import { sendSuccessResp } from "../utils/respUtils.js";
class NotificationController {
    getNotifications = async (c) => {
        const user = c.get("user_payload");
        const page = +(c.req.query("page") || 1);
        const limit = +(c.req.query("limit") || 10);
        const { records, total } = await getNotificationsForUser(user.id, page, limit);
        const pagination_records = getPaginationData(page, limit, total);
        const result = { pagination_records, records };
        return sendSuccessResp(c, 200, "Notifications fetched successfully", result);
    };
    isNotificationRead = async (c) => {
        const user = c.get("user_payload");
        const notificationId = +c.req.param("id");
        if (!notificationId) {
            throw new Error("Notification id is required");
        }
        const notification = await getSingleRecordByMultipleColumnValues(notifications, ["id", "user_id"], [notificationId, user.id], ["id"]);
        if (!notification) {
            throw new Error("Notification not found");
        }
        await updateRecordById(notifications, notificationId, { is_marked: true });
        return sendSuccessResp(c, 200, "Notification marked as read");
    };
    markAllNotificationsRead = async (c) => {
        const user = c.get("user_payload");
        const allNotifications = await getRecordsConditionally(notifications, { columns: ["user_id", "is_marked"], values: [user.id, false] }, ["id"]);
        if (!allNotifications || allNotifications.length === 0) {
            return sendSuccessResp(c, 200, "No notifications to mark");
        }
        await updateRecordByMultipleColumnValues(notifications, ["user_id", "is_marked"], [user.id, false], { is_marked: true });
        return sendSuccessResp(c, 200, "All notifications marked as read");
    };
    countUnreadNotifications = async (c) => {
        const user = c.get("user_payload");
        const count = await getRecordsCount(notifications, [eq(notifications.user_id, user.id), eq(notifications.is_marked, false)]);
        ;
        return sendSuccessResp(c, 200, "Unread notifications count", count);
    };
}
export default NotificationController;
