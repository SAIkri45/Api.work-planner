import { number, object, optional, string } from "valibot";
export const CreateChatSchema = object({
    description: string("Description is required"),
    project_id: optional(number()),
    task_id: optional(number()),
});
