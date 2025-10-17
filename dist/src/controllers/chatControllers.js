import { chats } from "../db/schema/chats.js";
import { getPaginationData } from "../helpers/paginationHelper.js";
import { getRecordsCount, saveSingleRecord } from "../services/db/baseDbService.js";
import { getChatsByTaskId } from "../services/db/chatServices.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { validateRequest } from "../validations/validateRequest.js";
import { eq } from "drizzle-orm";
export class ChatController {
    createChat = async (c) => {
        const user = c.get("user_payload");
        const body = await c.req.json();
        const validatedReq = await validateRequest("create-chat", body, "Chat validation error");
        const newChat = await saveSingleRecord(chats, {
            ...validatedReq,
            user_id: user.id,
        });
        return sendSuccessResp(c, 200, "Chat created successfully", newChat);
    };
    getAllChats = async (c) => {
        const task_id = +c.req.param("task_id");
        const page = +(c.req.query("page") || 1);
        const limit = +(c.req.query("limit") || 10);
        const result = await getChatsByTaskId(task_id, page, limit);
        const total = await getRecordsCount(chats, [eq(chats.task_id, task_id)]);
        const paginationInfo = getPaginationData(page, limit, total);
        return sendSuccessResp(c, 200, "Chats fetched successfully", { pagination_info: paginationInfo, records: result });
    };
}
