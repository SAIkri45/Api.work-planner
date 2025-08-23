import type { Context } from "hono";

import type { NewTask, Task } from "../db/schema/tasks";
import type { DBTableColumns, OrderByQueryData, SortDirection, WhereQueryData } from "../types/dbTypes";

import { TASK_CREATED, TASKS_FETCHED } from "../constants/appMessages";
import { Tasks } from "../db/schema/tasks";
import { getPaginatedRecordsConditionally, saveSingleRecord } from "../services/db/baseDbService";
import { sendSuccessResp } from "../utils/respUtils";

// Types
// type Task = InferSelectModel<typeof tasks>;
// type NewTask = InferInsertModel<typeof tasks>;

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

    let orderByQueryData: OrderByQueryData<Task> = {
      columns: ["created_at"],
      values: ["desc"],
    };

    const whereQueryData: WhereQueryData<Task> = {
      columns: [],
      values: [],
    };

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
      whereQueryData,
    );

    return sendSuccessResp(c, 200, TASKS_FETCHED, result);
  };
}

export default TasksController;
