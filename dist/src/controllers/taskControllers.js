import { and, count, gte, isNull, lte } from "drizzle-orm";
import { error } from "node:console";
import { TASK_ID_REQUIRED, TASK_NOT_FOUND, TASK_UPDATED, TASKS_FETCHED, } from "../constants/appMessages.js";
import { db } from "../db/configuration.js";
import { Tasks } from "../db/schema/tasks.js";
import BadRequestException from "../exceptions/badRequestException.js";
import NotFoundException from "../exceptions/notFoundException.js";
import { buildTaskQueryData } from "../helpers/queryHelper.js";
import { getPaginatedRecordsConditionally, getRecordById, updateRecordById, } from "../services/db/baseDbService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
export class TasksController {
    // Get Paginated Tasks (GET)
    getPaginatedTasks = async (c) => {
        try {
            const page = +c.req.query("page") || 1;
            const pageSize = +c.req.query("page_size") || 10;
            const searchString = c.req.query("search_string")?.trim() || null;
            const orderBy = c.req.query("order_by") || null;
            const task_status = c.req.query("task_status") || null;
            const { orderByQueryData, whereQueryData } = buildTaskQueryData(searchString, orderBy, task_status);
            const result = await getPaginatedRecordsConditionally(Tasks, page, pageSize, orderByQueryData, whereQueryData);
            return sendSuccessResp(c, 200, TASKS_FETCHED, result);
        }
        catch {
            throw error;
        }
    };
    // Get Task By Id
    getTaskById = async (c) => {
        try {
            const id = c.req.param("id");
            if (!id || Number.isNaN(id)) {
                throw new BadRequestException(TASK_ID_REQUIRED);
            }
            const task = await getRecordById(Tasks, +id, ["id", "deleted_at"]);
            if (!task || task.deleted_at !== null) {
                throw new NotFoundException(TASK_NOT_FOUND);
            }
            return sendSuccessResp(c, 200, TASKS_FETCHED, task);
        }
        catch {
            throw error;
        }
    };
    // Edit Task (PATCH)
    editTask = async (c) => {
        try {
            const id = Number(c.req.param("id"));
            const body = await c.req.json();
            const existingTask = await getRecordById(Tasks, id, [
                "id",
                "deleted_at",
            ]);
            if (!existingTask || existingTask.deleted_at !== null) {
                throw new NotFoundException(TASK_NOT_FOUND);
            }
            const updatedTask = await updateRecordById(Tasks, id, {
                ...body,
            });
            return sendSuccessResp(c, 200, TASK_UPDATED, updatedTask);
        }
        catch {
            throw error;
        }
    };
    // Get Task Status Counts (GET)
    getTaskStatusCounts = async (c) => {
        try {
            const { startDate, endDate } = c.req.query();
            const conditions = [isNull(Tasks.deleted_at)];
            if (startDate) {
                conditions.push(gte(Tasks.start_date, startDate));
            }
            if (endDate) {
                conditions.push(lte(Tasks.end_date, endDate));
            }
            const statusCounts = await db
                .select({
                task_status: Tasks.task_status,
                count: count(Tasks.id).as("count"),
            })
                .from(Tasks)
                .where(and(...conditions))
                .groupBy(Tasks.task_status);
            const overallCount = await db
                .select({ total: count(Tasks.id) })
                .from(Tasks)
                .where(and(...conditions));
            const counts = {
                NEW: 0,
                IN_PROGRESS: 0,
                COMPLETED: 0,
                REVIEW: 0,
                OVERDUE: 0,
                DONE: 0,
            };
            statusCounts.forEach((row) => {
                counts[row.task_status] = Number(row.count);
            });
            return sendSuccessResp(c, 200, "Task counts fetched successfully", {
                ...counts,
                overall: Number(overallCount[0]?.total ?? 0),
            });
        }
        catch (error) {
            throw error;
        }
    };
}
export default TasksController;
