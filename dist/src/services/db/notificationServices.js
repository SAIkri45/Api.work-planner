import { desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/configuration.js";
import { notifications } from "../../db/schema/notification.js";
import { saveRecordsWithTrx } from "./baseDbService.js";
import { user_projects } from "../../db/schema/userProjects.js";
export const createNotificationsForUsers = async (title, creatorDescription, userDescription, category, trx, userIds, projectId, taskId, creatorId) => {
    if ((!userIds || !userIds.length) && projectId) {
        const assignedUsers = await db
            .select({ user_id: user_projects.user_id })
            .from(user_projects)
            .where(eq(user_projects.project_id, projectId));
        userIds = assignedUsers
            .map(u => u.user_id)
            .filter((id) => id !== null);
    }
    if (creatorId) {
        userIds = userIds ? [...userIds, creatorId] : [creatorId];
    }
    if (!userIds?.length)
        return;
    const notificationRecords = userIds.map((user_id) => ({
        user_id,
        project_id: projectId,
        task_id: taskId ?? null,
        title,
        description: user_id === creatorId ? creatorDescription : userDescription,
        category,
    }));
    await saveRecordsWithTrx(notifications, notificationRecords, trx);
};
export async function getNotificationsForUser(userId, page, limit) {
    const offset = (page - 1) * limit;
    const total = await db
        .select({ count: sql `count(*)` })
        .from(notifications)
        .where(eq(notifications.user_id, userId));
    const records = await db.
        select().
        from(notifications).
        where(eq(notifications.user_id, userId)).
        orderBy(desc(notifications.created_at)).
        offset(offset).
        limit(limit);
    return { records, total: total[0].count };
}
