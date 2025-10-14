import { getNotificationsForUser } from "../services/db/notificationServices.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { getPaginationData } from "../helpers/paginationHelper.js";
import { getSingleRecordByMultipleColumnValues, updateRecordById } from "../services/db/baseDbService.js";
import { notifications } from "../db/schema/notification.js";
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
}
export default NotificationController;
