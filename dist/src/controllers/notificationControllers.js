import { eq } from "drizzle-orm";
import { notifications } from "../db/schema/notification.js";
import BadRequestException from "../exceptions/badRequestException.js";
import NotFoundException from "../exceptions/notFoundException.js";
import { getPaginatedRecordsConditionally, getRecordsConditionally, getRecordsCount, getSingleRecordByMultipleColumnValues, updateRecordById, updateRecordByMultipleColumnValues } from "../services/db/baseDbService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { parseOrderByQuery } from "../helpers/parseOrderByHelper.js";
class NotificationController {
    getNotifications = async (c) => {
        const user = c.get("user_payload");
        const page = +(c.req.query("page") || 1);
        const pageSize = +(c.req.query("page_size") || 10);
        const orderBy = c.req.query("order_by");
        const orderByQueryData = parseOrderByQuery("created_at", "desc", orderBy);
        const whereQueryData = {
            columns: ["user_id"],
            values: [user.id],
            relations: ["eq"],
        };
        const columnsToSelect = ["id", "user_id", "project_id", "task_id", "title", "description", "category", "created_at", "updated_at", "is_marked"];
        const result = await getPaginatedRecordsConditionally(notifications, page, pageSize, orderByQueryData, whereQueryData, columnsToSelect);
        return sendSuccessResp(c, 200, "NOTIFICATIONS_FETCHED", result);
    };
    isNotificationRead = async (c) => {
        const user = c.get("user_payload");
        const notificationId = +c.req.param("id");
        if (!notificationId) {
            throw new BadRequestException("Notification id is required");
        }
        const notification = await getSingleRecordByMultipleColumnValues(notifications, ["id", "user_id"], [notificationId, user.id], ["id"]);
        if (!notification) {
            throw new NotFoundException("Notification not found");
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
        const result = await getRecordsCount(notifications, [eq(notifications.user_id, user.id), eq(notifications.is_marked, false)]);
        ;
        return sendSuccessResp(c, 200, "Unread notifications count", { count: result });
    };
}
export default NotificationController;
