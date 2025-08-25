import type { Context } from "hono";
import type {
  DBTableColumns,
  OrderByQueryData,
  SortDirection,
  WhereQueryData,
} from "../types/dbTypes";

import { NewTask, Task, Tasks } from "../db/schema/tasks";
import {
  getPaginatedRecordsConditionally,
  getRecordById,
  saveSingleRecord,
  getPaginatedRecords,
  updateRecordById,
} from "../services/db/baseDbService";
import { sendSuccessResp } from "../utils/respUtils";

import {
  TASKS_FETCHED,
  TASK_CREATED,
  TASK_NOT_FOUND,
} from "../constants/appMessages";
import { PgTableWithColumns, PgColumn } from "drizzle-orm/pg-core";

export class TasksController {
  // 1. Create Task (POST)
  createTask = async (c: Context) => {
    const body = await c.req.json<NewTask>();

    const insertedTask = await saveSingleRecord<Task>(Tasks, body);

    return sendSuccessResp(c, 201, TASK_CREATED, insertedTask);
  };

  // 2. Get Paginated Tasks (GET)
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

  // 3. getbyid
  getTaskById = async (c: Context) => {
    const id = Number(c.req.param("id"));

    const task = await getRecordById<Task>(Tasks, id);

    return sendSuccessResp(c, 200, TASKS_FETCHED, task);
  };
  // 4. Edit Task (PATCH)

  editTask = async (c: Context) => {
    const id = Number(c.req.param("id"));
    const body = await c.req.json();

    const updatedTask = await updateRecordById<Task>(Tasks, id, {
      ...body,
      updated_at: new Date(),
    });

    return sendSuccessResp(c, 200, "Task updated successfully", updatedTask);
  };

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
}
export default TasksController;
