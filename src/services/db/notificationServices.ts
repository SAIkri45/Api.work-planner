import { desc, eq } from "drizzle-orm";

import { db } from "../../db/configuration.js";
import { NewNotification, Notification, notifications } from "../../db/schema/notification.js";
import { saveRecordsWithTrx } from "./baseDbService.js";
export const createNotificationsForUsers = async (
  title: string,
  description: string,
  category: string,
  trx: any,
  userIds?: number[],
  projectId?: number | null,
  taskId?: number | null,
 ) => {
  if (!userIds?.length) return;

  const notificationRecords: NewNotification[] = userIds.map((user_id) => ({
    user_id,
    project_id: projectId,
    task_id: taskId??null,
    title,
    description,
    category,
  }));

  await saveRecordsWithTrx(notifications, notificationRecords, trx);
};


export async function getNotificationsForUser(userId: number) {
  return await db.select().from(notifications).where(eq(notifications.user_id, userId)).orderBy(desc(notifications.created_at));
}
