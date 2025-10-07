import type { Context } from "hono";

import { eq, gte, isNull, lte } from "drizzle-orm";

import type { Task } from "../db/schema/tasks.js";
import type { UserTaskStatisticsResponse } from "../types/appTypes.js";
import type { WhereQueryData } from "../types/dbTypes.js";

import { DASHBOARD_FETCHED, TODAY_TASKS_FETCHED, TODAY_TASKS_STATUS_COUNT_FETCHED } from "../constants/appMessages.js";
import { Tasks } from "../db/schema/tasks.js";
import { getTodayDateRange, getTodayDateRangeIst } from "../helpers/dashBoardhelper.js";
import { getPaginationData } from "../helpers/paginationHelper.js";
import { parseOrderByQuery } from "../helpers/parseOrderByHelper.js";
import { getPaginatedRecordsConditionally, getRecordsCount } from "../services/db/baseDbService.js";
import { getUserTaskStatisticsWithPagination } from "../services/db/dashBoardService.js";
import { sendSuccessResp } from "../utils/respUtils.js";

class DashBoardController {
  getDashboardStatus = async (c: Context) => {
    const [completedTasksCount, inProgressTasksCount, reviewTasksCount, overDueTasksCount, newTasksCount, totalTasksCount]:
    [number, number, number, number, number, number] = await Promise.all([
      getRecordsCount(Tasks, [eq(Tasks.task_status, "COMPLETED"), isNull(Tasks.deleted_at)]),
      getRecordsCount(Tasks, [eq(Tasks.task_status, "IN_PROGRESS"), isNull(Tasks.deleted_at)]),
      getRecordsCount(Tasks, [eq(Tasks.task_status, "REVIEW"), isNull(Tasks.deleted_at)]),
      getRecordsCount(Tasks, [eq(Tasks.task_status, "OVERDUE"), isNull(Tasks.deleted_at)]),
      getRecordsCount(Tasks, [eq(Tasks.task_status, "NEW"), isNull(Tasks.deleted_at)]),
      getRecordsCount(Tasks, [isNull(Tasks.deleted_at)]),
    ]);

    return sendSuccessResp(c, 200, DASHBOARD_FETCHED, {
      total_tasks_count: totalTasksCount,
      completed_tasks: completedTasksCount,
      in_progress_tasks: inProgressTasksCount,
      review_tasks_Count: reviewTasksCount,
      overdue_TasksCount: overDueTasksCount,
      new_tasks_Count: newTasksCount,
    });
  };

  overAllStatistics = async (c: Context) => {
    const page = +c.req.query("page")! || 1;
    const pageSize = +c.req.query("page_size")! || 10;
    const offset = (page - 1) * pageSize;
    const search = c.req.query("search_string");
    const orderBy = c.req.query("order_by");

    const { total_records, result } = await getUserTaskStatisticsWithPagination(
      offset,
      pageSize,
      search,
      orderBy,
    );

    const paginationInfo = getPaginationData(page, pageSize, total_records);

    const finalResponse: UserTaskStatisticsResponse = {
      pagination_info: paginationInfo,
      records: result,
    };
    return sendSuccessResp(c, 200, DASHBOARD_FETCHED, finalResponse);
  };

  todayTasks = async (c: Context) => {
    const page = +c.req.query("page")! || 1;
    const pageSize = +c.req.query("page_size")! || 10;
    const orderBy = c.req.query("order_by");
    const taskStatus = c.req.query("task_status");
    const searchString = c.req.query("search_string");

    const orderByQueryData = parseOrderByQuery<Task>("id", "desc", orderBy);

    const whereQueryData: WhereQueryData<Task> = {
      columns: ["deleted_at"],
      values: [null],
    };

    const { todayStart, todayEnd } = getTodayDateRangeIst();
    
    whereQueryData.columns.push("start_date", "end_date");
    whereQueryData.values.push(
      { lte: todayEnd },
      { gte: todayStart },
    );


    if (taskStatus) {
      whereQueryData.columns.push("task_status");
      whereQueryData.values.push(taskStatus);
    }

    if (searchString) {
      whereQueryData.columns.push("task_title");
      whereQueryData.values.push(`%${searchString}%`);
    }

    const columnsToSelect = ["id", "task_title", "task_status", "start_date", "end_date", "created_at"] as const;

    const result = await getPaginatedRecordsConditionally<Task>(
      Tasks,
      page,
      pageSize,
      orderByQueryData,
      whereQueryData,
      columnsToSelect,
    );

    return sendSuccessResp(c, 200, TODAY_TASKS_FETCHED, result);
  };

  todaysTasksStatusCount = async (c: Context) => {
    const { todayStart, todayEnd } = getTodayDateRange();
    const todayStartISO = todayStart.toISOString();
    const todayEndISO = todayEnd.toISOString();

    const [completedTasksCount, inProgressTasksCount, reviewTasksCount, overDueTasksCount, newTasksCount, totalTasksCount]:
    [number, number, number, number, number, number] = await Promise.all([
      getRecordsCount(Tasks, [eq(Tasks.task_status, "COMPLETED"),lte(Tasks.start_date, todayEndISO),gte(Tasks.end_date, todayStartISO), isNull(Tasks.deleted_at)]),
      getRecordsCount(Tasks, [eq(Tasks.task_status, "IN_PROGRESS"),lte(Tasks.start_date, todayEndISO),gte(Tasks.end_date, todayStartISO), isNull(Tasks.deleted_at)]),
      getRecordsCount(Tasks, [eq(Tasks.task_status, "REVIEW"),lte(Tasks.start_date, todayEndISO),gte(Tasks.end_date, todayStartISO), isNull(Tasks.deleted_at)]),
      getRecordsCount(Tasks, [eq(Tasks.task_status, "OVERDUE"),lte(Tasks.start_date, todayEndISO),gte(Tasks.end_date, todayStartISO), isNull(Tasks.deleted_at)]),
      getRecordsCount(Tasks, [eq(Tasks.task_status, "NEW"),lte(Tasks.start_date, todayEndISO),gte(Tasks.end_date, todayStartISO), isNull(Tasks.deleted_at)]),
      getRecordsCount(Tasks, [lte(Tasks.start_date, todayEndISO),gte(Tasks.end_date, todayStartISO), isNull(Tasks.deleted_at)]),
    ]);

    return sendSuccessResp(c, 200, TODAY_TASKS_STATUS_COUNT_FETCHED, {
      total_tasks_count: totalTasksCount,
      completed_tasks: completedTasksCount,
      in_progress_tasks: inProgressTasksCount,
      review_tasks_Count: reviewTasksCount,
      overdue_TasksCount: overDueTasksCount,
      new_tasks_Count: newTasksCount,
    });
  };

  
}

export default DashBoardController;
