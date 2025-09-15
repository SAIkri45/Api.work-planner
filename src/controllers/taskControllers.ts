import type { Context } from "hono";

import { and, count, gte, isNull, lte } from "drizzle-orm";

import type { Task } from "../db/schema/tasks.js";
import type { ValidatedUpdateTask } from "../validations/schemas/vTaskSchema.js";

import {
  INVALID_INPUT,
  TASK_NOT_FOUND,
  TASK_UPDATED,
  TASK_VALIDATION_ERROR,
  TASKS_FETCHED,
} from "../constants/appMessages.js";
import { db } from "../db/configuration.js";
import { Tasks } from "../db/schema/tasks.js";
import BadRequestException from "../exceptions/badRequestException.js";
import NotFoundException from "../exceptions/notFoundException.js";
import { getPaginationData } from "../helpers/paginationHelper.js";
import {
  getSingleRecordByMultipleColumnValues,
  updateRecordById,
} from "../services/db/baseDbService.js";
import { gatAllTaskList } from "../services/db/taskService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { validateRequest } from "../validations/validateRequest.js";

export class TasksController {
  // Get Paginated Tasks (GET)
  getPaginatedTasks = async (c: Context) => {
    try {
      const page = +c.req.query("page")! || 1;
      const pageSize = +c.req.query("page_size")! || 10;
      const offset = (page - 1) * pageSize;
      const searchString = c.req.query("search_string");
      const orderBy = c.req.query("order_by");
      const taskStatus = c.req.query("task_status");
      const startDate = c.req.query("from_date");
      const endDate = c.req.query("to_date");

      const { result, total_records } = await gatAllTaskList(offset, pageSize, searchString, orderBy, taskStatus, startDate, endDate);

      const paginationInfo = getPaginationData(page, pageSize, total_records);

      const finalResponse = {
        pagination_info: paginationInfo,
        records: result,
      };

      return sendSuccessResp(c, 200, TASKS_FETCHED, finalResponse);
    }
    catch (error) {
      throw error;
    }
  };

  // Get Task By Id
  getTaskById = async (c: Context) => {
    const taskId = +c.req.param("id");

    if (!taskId) {
      throw new BadRequestException(INVALID_INPUT);
    }

    const taskExists = await getSingleRecordByMultipleColumnValues<Task>(Tasks, ["id", "deleted_at"], [taskId, null], ["id"]);

    if (!taskExists) {
      throw new NotFoundException(TASK_NOT_FOUND);
    }

    const columnsToSelect = ["id", "task_title", "description", "task_status", "project_id", "created_by", "updated_by", "start_date", "end_date", "created_at", "updated_at"] as const;

    const result = await getSingleRecordByMultipleColumnValues<Task>(Tasks, ["id", "deleted_at"], [taskId, null], columnsToSelect);

    return sendSuccessResp(c, 200, TASKS_FETCHED, result);
  };

  // Edit Task (PATCH)
  editTask = async (c: Context) => {
    const taskId = +c.req.param("id");
    const userDetails = c.get("user_payload");

    const reqBody = await c.req.json();

    const validatedReq = await validateRequest<ValidatedUpdateTask>("update-task", reqBody, TASK_VALIDATION_ERROR);

    const taskExists = await getSingleRecordByMultipleColumnValues<Task>(Tasks, ["id", "deleted_at"], [taskId, null], ["id"]);

    if (!taskExists) {
      throw new NotFoundException(TASK_NOT_FOUND);
    }
    //  const result = await updateRecordById<Task>(Tasks, taskId, validatedReq);

    const result = await updateRecordById<Task>(Tasks, taskId, { ...validatedReq, updated_by: userDetails.id });

    return sendSuccessResp(c, 200, TASK_UPDATED, result);
  };

  // Get Task Status Counts (GET)
  getTaskStatusCounts = async (c: Context) => {
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

      const counts: Record<string, number> = {
        NEW: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0,
        REVIEW: 0,
        OVERDUE: 0,
        DONE: 0,
      };

      statusCounts.forEach((row) => {
        counts[row.task_status as keyof typeof counts] = Number(row.count);
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

  // tasksdropdown
  // getAllTasksDropdown = async (c: Context) => {
  //   const page = +c.req.query("page")! || 1;
  //   const pageSize = +c.req.query("page_size")! || 10;
  //   const search_string = c.req.query("search_string")?.trim() || null;

  //   const whereQueryData: WhereQueryData<Task> = {
  //     columns: [],
  //     values: [],
  //   };

  //   if (search_string) {
  //     whereQueryData.columns.push("task_title");
  //     whereQueryData.values.push(`%${search_string}%`);
  //   }

  //   const orderByQueryData: OrderByQueryData<Task> = {
  //     columns: ["created_at"],
  //     values: ["desc"],
  //   };

  //   const result = await getPaginatedRecordsConditionally<Task>(
  //     Tasks,
  //     page,
  //     pageSize,
  //     orderByQueryData,
  //     whereQueryData,
  //     ["id", "task_title"]
  //   );

  //   return sendSuccessResp(
  //     c,
  //     200,
  //     "Dropdown tasks fetched successfully",
  //     result
  //   );
  // };
}
export default TasksController;
