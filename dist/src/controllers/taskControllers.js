import { TASK_CREATED, TASKS_FETCHED } from "../constants/appMessages";
import { Tasks } from "../db/schema/tasks";
import { getPaginatedRecordsConditionally, saveSingleRecord } from "../services/db/baseDbService";
import { sendSuccessResp } from "../utils/respUtils";
// Types
// type Task = InferSelectModel<typeof tasks>;
// type NewTask = InferInsertModel<typeof tasks>;
export class TasksController {
    // 1. Create Task (POST)
    createTask = async (c) => {
        const body = await c.req.json();
        const insertedTask = await saveSingleRecord(Tasks, body);
        return sendSuccessResp(c, 201, TASK_CREATED, insertedTask);
    };
    // 2. Get Paginated Tasks (GET)
    getPaginatedTasks = async (c) => {
        const page = +c.req.query("page") || 1;
        const pageSize = +c.req.query("page_size") || 10;
        const searchString = c.req.query("search_string")?.trim() || null;
        const orderBy = c.req.query("order_by");
        let orderByQueryData = {
            columns: ["created_at"],
            values: ["desc"],
        };
        const whereQueryData = {
            columns: [],
            values: [],
        };
        if (searchString) {
            whereQueryData.columns.push("task_title");
            whereQueryData.values.push(`%${searchString}%`);
        }
        if (orderBy) {
            const orderByColumns = [];
            const orderByValues = [];
            const queryStrings = orderBy.split(",");
            for (const queryString of queryStrings) {
                const [column, value] = queryString.split(":");
                orderByColumns.push(column);
                orderByValues.push(value);
            }
            orderByQueryData = {
                columns: orderByColumns,
                values: orderByValues,
            };
        }
        const result = await getPaginatedRecordsConditionally(Tasks, page, pageSize, orderByQueryData, whereQueryData);
        return sendSuccessResp(c, 200, TASKS_FETCHED, result);
    };
}
export default TasksController;
