import { custom, InferOutput, number, NumberSchema, object, ObjectSchema, optional, OptionalSchema, string } from "valibot";


export const CreateChatSchema = object({
  description: string("Description is required"),
  project_id: optional(number()),
  task_id: optional(number()),
});


export type ValidatedCreateChat = InferOutput<typeof CreateChatSchema>;
