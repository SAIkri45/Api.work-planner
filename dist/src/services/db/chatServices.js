import { asc, eq } from "drizzle-orm";
import { db } from "../../db/configuration.js";
import { chats } from "../../db/schema/chats.js";
export async function getChatsByTaskId(taskId, page, limit) {
    return await db.query.chats.findMany({
        where: eq(chats.task_id, taskId),
        orderBy: asc(chats.created_at),
        limit,
        offset: (page - 1) * limit,
        with: {
            user: {
                columns: {
                    id: true,
                    display_name: true,
                },
            },
        },
    });
}
