import type { Context } from "hono";

import type { User } from "../db/schema/users.js";
import type { ValidatedCreateChat } from "../validations/schemas/vChatSchema.js";

import { chats } from "../db/schema/chats.js";
import { getPaginationData } from "../helpers/paginationHelper.js";
import { getRecordsCount, saveSingleRecord } from "../services/db/baseDbService.js";
import { getChatsByTaskId } from "../services/db/chatServices.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { validateRequest } from "../validations/validateRequest.js";

export class ChatController {
  createChat = async (c: Context) => {
    const user: User = c.get("user_payload");
    const body = await c.req.json();
    const validatedReq = await validateRequest<ValidatedCreateChat>("create-chat", body, "Chat validation error");
    const newChat = await saveSingleRecord(chats, {
      ...validatedReq,
      user_id: user.id,
    });
    return sendSuccessResp(c, 200, "Chat created successfully", newChat);
  };

  getAllChats = async (c: Context) => {
    const task_id = +c.req.param("task_id");
    const page = +(c.req.param("page") || 1);
    const limit = +(c.req.param("limit") || 10);
    const result = await getChatsByTaskId(task_id, page, limit);
    const total = await getRecordsCount(chats, { task_id });
    const paginationInfo = getPaginationData(1, 10, total);
    return sendSuccessResp(c, 200, "Chats fetched successfully", { pagination_info: paginationInfo, records: result });
  };
}
