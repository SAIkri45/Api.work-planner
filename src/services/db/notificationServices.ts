
import { getIO } from "../../../socket/index.js";
import { db } from "../../db/configuration.js";
import {  notifications } from "../../db/schema/notification.js";
import {  saveSingleRecordWithTrx } from "./baseDbService.js";
import {desc,eq} from "drizzle-orm";    

interface NotificationInput {
  user_id: number;
  sender_id: number;
  project_id: number;
  title: string;
  message: string;
  type: string;
  created_at?: Date;
  updated_at?: Date;
}

export async function createNotification(input: NotificationInput,trx:any) {
  const notification = await saveSingleRecordWithTrx(notifications, input,trx);
  const io = getIO();
  io.to(`user_${input.user_id}`).emit("notification", notification);
  return notification;
}

export async function getNotificationsForUser(userId: number) {
    return await db.select().from(notifications)
      .where(eq(notifications.user_id, userId))
      .orderBy(desc(notifications.created_at));
  }