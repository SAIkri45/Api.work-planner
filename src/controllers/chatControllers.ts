import { Context } from "hono";
import { User } from "../db/schema/users.js";
import {  saveSingleRecord } from "../services/db/baseDbService.js";
import {  chats } from "../db/schema/chats.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { validateRequest } from "../validations/validateRequest.js";
import { ValidatedCreateChat } from "../validations/schemas/vChatSchema.js";




export class ChatController {
    createChat = async (c:Context) => {
        const user:User = c.get("user_payload");
        const body= await c.req.json();
        const validatedReq = await validateRequest<ValidatedCreateChat>("create-chat", body, "Chat validation error");
        const newChat = await saveSingleRecord(chats, {
            ...validatedReq,
            user_id:user.id
         })
         return  sendSuccessResp(c, 200, "Chat created successfully", newChat);
    }


}


