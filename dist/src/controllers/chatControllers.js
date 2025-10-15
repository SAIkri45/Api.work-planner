import { saveSingleRecord } from "../services/db/baseDbService.js";
import { chats } from "../db/schema/chats.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { validateRequest } from "../validations/validateRequest.js";
export class ChatController {
    createChat = async (c) => {
        const user = c.get("user_payload");
        const body = await c.req.json();
        const validatedReq = await validateRequest("create-chat", body, "Chat validation error");
        const newChat = await saveSingleRecord(chats, {
            ...validatedReq,
            user_id: user.id
        });
        return sendSuccessResp(c, 200, "Chat created successfully", newChat);
    };
}
