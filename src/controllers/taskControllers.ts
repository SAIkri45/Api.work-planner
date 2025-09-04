import { and, eq, isNull } from "drizzle-orm";
import type { Context } from "hono";
import {
  TASKS_FETCHED,
  TASK_UPDATED,
  TASK_NOT_FOUND,
  TASK_ID_REQUIRED,
} from "../constants/appMessages";
import { db } from "../db/configuration.js";
import { Task, Tasks } from "../db/schema/tasks";
import {
  getPaginatedRecordsConditionally,
  getRecordById,
  updateRecordById,
} from "../services/db/baseDbService";
import type {
  DBTableColumns,
  OrderByQueryData,
  SortDirection,
  WhereQueryData,
} from "../types/dbTypes";
import { sendSuccessResp } from "../utils/respUtils";

// exceptions
import BadRequestException from "../exceptions/badRequestException.js";
import NotFoundException from "../exceptions/notFoundException.js";

export class TasksController {
  // Get Paginated Tasks (GET)
  getPaginatedTasks = async (c: Context) => {
    const page = +c.req.query("page")! || 1;
    const pageSize = +c.req.query("page_size")! || 10;
    const searchString = c.req.query("search_string")?.trim() || null;
    const orderBy = c.req.query("order_by");
    const task_status = c.req.query("task_status");

    let orderByQueryData: OrderByQueryData<Task> = {
      columns: ["created_at"],
      values: ["desc"],
    };

    const whereQueryData: WhereQueryData<Task> = {
      columns: [],
      values: [],
    };
    if (task_status) {
      whereQueryData.columns.push("task_status");
      whereQueryData.values.push(task_status);
    }

    if (searchString) {
      whereQueryData.columns.push("task_title");
      whereQueryData.values.push(`%${searchString}%`);
    }

    if (orderBy) {
      const orderByColumns: DBTableColumns<Task>[] = [];
      const orderByValues: SortDirection[] = [];
      const queryStrings = orderBy.split(",");
      for (const queryString of queryStrings) {
        const [column, value] = queryString.split(":");
        orderByColumns.push(column as DBTableColumns<Task>);
        orderByValues.push(value as SortDirection);
      }
      orderByQueryData = {
        columns: orderByColumns,
        values: orderByValues,
      };
    }

    const result = await getPaginatedRecordsConditionally<Task>(
      Tasks,
      page,
      pageSize,
      orderByQueryData,
      whereQueryData
    );

    return sendSuccessResp(c, 200, TASKS_FETCHED, result);
  };

  // Get Task By Id
  getTaskById = async (c: Context) => {
    const id = Number(c.req.param("id"));

    if (!id) {
      throw new BadRequestException(TASK_ID_REQUIRED);
    }

    
    const task = await getRecordById<Task>(Tasks, id);

    
    if (!task || task.deleted_at !== null) {
      throw new NotFoundException(TASK_NOT_FOUND);
    }

    return sendSuccessResp(c, 200, TASKS_FETCHED, task);
  };

  // Edit Task (PATCH)
  editTask = async (c: Context) => {
    const id = Number(c.req.param("id"));

    const body = await c.req.json();
    if (!body) {
      throw new BadRequestException(TASK_ID_REQUIRED);
    }

    const existingTask = await getRecordById<Task>(Tasks, id, [
      "id",
      "deleted_at",
    ]);

    if (!existingTask || existingTask.deleted_at !== null) {
      throw new NotFoundException(TASK_NOT_FOUND);
    }

    const updatedTask = await updateRecordById<Task>(Tasks, id, {
      ...body,
    });

    return sendSuccessResp(c, 200, TASK_UPDATED, updatedTask);
  };
}

//tasksdropdown
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

export default TasksController;
