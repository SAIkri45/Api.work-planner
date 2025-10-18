import { desc, eq, sql } from "drizzle-orm";
import { db } from "../../db/configuration.js";
import { notifications } from "../../db/schema/notification.js";
import { task_assignees } from "../../db/schema/taskAssignees.js";
import { user_projects } from "../../db/schema/userProjects.js";
import { saveRecordsWithTrx } from "./baseDbService.js";
import { getIO } from "../../../socket/index.js";
export async function createNotificationsForUsers(title, creatorDescription, userDescription, category, trx, userIds, projectId, taskId, creatorId) {
    let assignedUsers;
    if ((!userIds || !userIds.length) && projectId && !taskId) {
        assignedUsers = await db
            .select({ user_id: user_projects.user_id })
            .from(user_projects)
            .where(eq(user_projects.project_id, projectId));
    }
    else if ((!userIds || !userIds.length) && taskId) {
        assignedUsers = await db
            .select({ user_id: task_assignees.user_id })
            .from(task_assignees)
            .where(eq(task_assignees.task_id, taskId));
    }
    if (assignedUsers && assignedUsers.length) {
        userIds = assignedUsers.map(u => u.user_id).filter((id) => id !== null);
    }
    if (creatorId) {
        userIds = userIds ? Array.from(new Set([...userIds, creatorId])) : [creatorId];
    }
    if (!userIds?.length)
        return;
    const notificationRecords = userIds.map(user_id => ({
        user_id,
        project_id: projectId,
        task_id: taskId ?? null,
        title,
        description: user_id === creatorId ? creatorDescription : userDescription,
        category,
    }));
    await saveRecordsWithTrx(notifications, notificationRecords, trx);
    const io = getIO();
    for (const user_id of userIds) {
        io.to(`user_${user_id}`).emit("newNotification", {
            title,
            description: user_id === creatorId ? creatorDescription : userDescription
        });
    }
}
export async function getNotificationsForUser(userId, page, limit) {
    const offset = (page - 1) * limit;
    const total = await db
        .select({ count: sql `count(*)` })
        .from(notifications)
        .where(eq(notifications.user_id, userId));
    const records = await db
        .select()
        .from(notifications)
        .where(eq(notifications.user_id, userId))
        .orderBy(desc(notifications.created_at))
        .offset(offset)
        .limit(limit);
    return { records, total: total[0].count };
}
