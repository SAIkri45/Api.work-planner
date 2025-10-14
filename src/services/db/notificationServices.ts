import { desc, eq, sql } from "drizzle-orm";

import { db } from "../../db/configuration.js";
import { NewNotification,Notifications,notifications } from "../../db/schema/notification.js";
import { saveRecordsWithTrx } from "./baseDbService.js";
import { user_projects } from "../../db/schema/userProjects.js";
export const createNotificationsForUsers = async (
  title: string,
  creatorDescription: string,
  userDescription: string,
  category: string,
  trx: any,
  userIds?: number[],
  projectId?: number ,
  taskId?: number,
  creatorId?: number
 ) => {
   
    if ((!userIds || !userIds.length) && projectId) {
    const assignedUsers = await db
      .select({ user_id: user_projects.user_id })
      .from(user_projects)
      .where(eq(user_projects.project_id, projectId));

    userIds = assignedUsers
    .map(u => u.user_id)
    .filter((id): id is number => id !== null); 
}
    if (creatorId) {
     userIds = userIds ? [...userIds, creatorId] : [creatorId];
    }

   if (!userIds?.length ) return;

   const notificationRecords: NewNotification[] = userIds.map((user_id) => ({
    user_id,
    project_id: projectId,
    task_id: taskId??null,
    title,
    description: user_id === creatorId ? creatorDescription : userDescription,
    category,
  }));

  await saveRecordsWithTrx<Notifications>(notifications, notificationRecords, trx);
};


export async function getNotificationsForUser(userId: number,page: number, limit: number) {
  const offset = (page - 1) * limit;
  const total = await db
    .select({ count: sql<number>`count(*)` })
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
