import { eq, gte, inArray, isNull, lte } from "drizzle-orm";
import { TASK_ID_REQUIRED, TASK_NOT_FOUND, TASK_STATUS_FETCHED, TASK_STATUS_UPDATED, TASK_UPDATED, TASK_VALIDATION_ERROR, TASKS_FETCHED, } from "../constants/appMessages.js";
import { Tasks } from "../db/schema/tasks.js";
import BadRequestException from "../exceptions/badRequestException.js";
import NotFoundException from "../exceptions/notFoundException.js";
import { getPaginationData } from "../helpers/paginationHelper.js";
import { buildWeeklySummaryResponse, getDateRange, getTaskCounts } from "../helpers/taskhelper.js";
import { getRecordsCount, getSingleRecordByMultipleColumnValues, updateRecordById, } from "../services/db/baseDbService.js";
import { gatAllTaskList, getUserAssignedTaskIds } from "../services/db/taskService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { validateRequest } from "../validations/validateRequest.js";
export class TasksController {
    // Get Paginated Tasks (GET)
    getPaginatedTasks = async (c) => {
        const user = c.get("user_payload");
        const page = +c.req.query("page") || 1;
        const pageSize = +c.req.query("page_size") || 10;
        const offset = (page - 1) * pageSize;
        const searchString = c.req.query("search_string");
        const orderBy = c.req.query("order_by");
        const taskStatus = c.req.query("task_status");
        const startDate = c.req.query("from_date");
        const endDate = c.req.query("to_date");
        const { result, total_records } = await gatAllTaskList(offset, pageSize, searchString, orderBy, taskStatus, startDate, endDate, user);
        const paginationInfo = getPaginationData(page, pageSize, total_records);
        const finalResponse = {
            pagination_info: paginationInfo,
            records: result,
        };
        return sendSuccessResp(c, 200, TASKS_FETCHED, finalResponse);
    };
    // Get Task By Id
    getTaskById = async (c) => {
        const taskId = +c.req.param("id");
        if (!taskId) {
            throw new BadRequestException(TASK_ID_REQUIRED);
        }
        const result = await getSingleRecordByMultipleColumnValues(Tasks, ["id", "deleted_at"], [taskId, null], ["id"]);
        if (!result) {
            throw new NotFoundException(TASK_NOT_FOUND);
        }
        // const columnsToSelect = ["id", "task_title", "description", "task_status", "project_id", "created_by", "updated_by", "start_date", "end_date", "created_at", "updated_at"] as const;
        // const result = await getSingleRecordByMultipleColumnValues<Task>(Tasks, ["id", "deleted_at"], [taskId, null], columnsToSelect);
        return sendSuccessResp(c, 200, TASKS_FETCHED, result);
    };
    // Edit Task (PATCH)
    editTask = async (c) => {
        const taskId = +c.req.param("id");
        const userDetails = c.get("user_payload");
        const reqBody = await c.req.json();
        if (!taskId) {
            throw new BadRequestException(TASK_ID_REQUIRED);
        }
        const validatedReq = await validateRequest("update-task", reqBody, TASK_VALIDATION_ERROR);
        const taskExists = await getSingleRecordByMultipleColumnValues(Tasks, ["id", "deleted_at"], [taskId, null], ["id"]);
        if (!taskExists) {
            throw new NotFoundException(TASK_NOT_FOUND);
        }
        //  const result = await updateRecordById<Task>(Tasks, taskId, validatedReq);
        const result = await updateRecordById(Tasks, taskId, { ...validatedReq, updated_by: userDetails.id });
        return sendSuccessResp(c, 200, TASK_UPDATED, result);
    };
    updateTaskStatus = async (c) => {
        const taskId = +c.req.param("id");
        const reqBody = await c.req.json();
        if (!taskId) {
            throw new BadRequestException(TASK_ID_REQUIRED);
        }
        const validatedReq = await validateRequest("update-task-status", reqBody, TASK_VALIDATION_ERROR);
        const taskExists = await getSingleRecordByMultipleColumnValues(Tasks, ["id", "deleted_at"], [taskId, null], ["id"]);
        if (!taskExists) {
            throw new NotFoundException(TASK_NOT_FOUND);
        }
        const result = await updateRecordById(Tasks, taskId, validatedReq);
        return sendSuccessResp(c, 200, TASK_STATUS_UPDATED, result);
    };
    getTaskStatusCounts = async (c) => {
        const { startDate, endDate, dateField } = c.req.query();
        const user = c.get("user_payload");
        const conditions = [isNull(Tasks.deleted_at)];
        if (startDate || endDate) {
            const dateColumn = dateField === "start_date" ? Tasks.start_date : Tasks.end_date;
            if (startDate) {
                conditions.push(gte(dateColumn, `${startDate}T00:00:00`));
            }
            if (endDate) {
                conditions.push(lte(dateColumn, `${endDate}T23:59:59`));
            }
        }
        const userTaskIds = await getUserAssignedTaskIds(user.id);
        if (userTaskIds.length > 0) {
            conditions.push(inArray(Tasks.id, userTaskIds));
        }
        const [completedTasksCount, inProgressTasksCount, reviewTasksCount, overDueTasksCount, newTasksCount, doneTasksCount, totalTasksCount,] = await Promise.all([
            getRecordsCount(Tasks, [eq(Tasks.task_status, "COMPLETED"), ...conditions]),
            getRecordsCount(Tasks, [eq(Tasks.task_status, "IN_PROGRESS"), ...conditions]),
            getRecordsCount(Tasks, [eq(Tasks.task_status, "REVIEW"), ...conditions]),
            getRecordsCount(Tasks, [eq(Tasks.task_status, "OVERDUE"), ...conditions]),
            getRecordsCount(Tasks, [eq(Tasks.task_status, "NEW"), ...conditions]),
            getRecordsCount(Tasks, [eq(Tasks.task_status, "DONE"), ...conditions]),
            getRecordsCount(Tasks, conditions),
        ]);
        return sendSuccessResp(c, 200, TASK_STATUS_FETCHED, {
            total_tasks: totalTasksCount,
            total_new_tasks: newTasksCount,
            total_in_progress_tasks: inProgressTasksCount,
            total_completed_tasks: completedTasksCount,
            total_review_tasks: reviewTasksCount,
            total_overdue_tasks: overDueTasksCount,
            total_done_tasks: doneTasksCount,
        });
    };
    getWeeklySummary = async (c) => {
        const user = c.get("user_payload");
        const [currentWeek, previousWeek] = await Promise.all([
            getTaskCounts(getDateRange(0), user.id),
            getTaskCounts(getDateRange(7), user.id),
        ]);
        const responseData = buildWeeklySummaryResponse(currentWeek, previousWeek);
        return sendSuccessResp(c, 200, "Weekly summary fetched successfully", responseData);
    };
}
export default TasksController;
