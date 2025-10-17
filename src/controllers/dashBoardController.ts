import type { Context } from "hono";

import { eq, gte, isNull, lte } from "drizzle-orm";

import { DASHBOARD_FETCHED, TODAY_TASKS_FETCHED, TODAY_TASKS_STATUS_COUNT_FETCHED } from "../constants/appMessages.js";
import { Tasks } from "../db/schema/tasks.js";
import { getTodayDateRange } from "../helpers/dashBoardhelper.js";
import { getPaginationData } from "../helpers/paginationHelper.js";
import { getRecordsCount } from "../services/db/baseDbService.js";
import { getTodayTasksWithUsersService, getUserTaskStatisticsWithPagination } from "../services/db/dashBoardService.js";
import { sendSuccessResp } from "../utils/respUtils.js";

class DashBoardController {
  getDashboardStatus = async (c: Context) => {
    const [completedTasksCount, inProgressTasksCount, reviewTasksCount, overDueTasksCount, newTasksCount, totalTasksCount]:
    [number, number, number, number, number, number] = await Promise.all([
      getRecordsCount(Tasks, [eq(Tasks.task_status, "COMPLETED"), isNull(Tasks.deleted_at)]),
      getRecordsCount(Tasks, [eq(Tasks.task_status, "IN_PROGRESS"), isNull(Tasks.deleted_at)]),
      getRecordsCount(Tasks, [eq(Tasks.task_status, "REVIEW"), isNull(Tasks.deleted_at)]),
      getRecordsCount(Tasks, [eq(Tasks.task_status, "OVERDUE"), isNull(Tasks.deleted_at)]),
      getRecordsCount(Tasks, [eq(Tasks.task_status, "TODO"), isNull(Tasks.deleted_at)]),
      getRecordsCount(Tasks, [isNull(Tasks.deleted_at)]),
    ]);

    return sendSuccessResp(c, 200, DASHBOARD_FETCHED, {
      total_tasks_count: totalTasksCount,
      completed_tasks: completedTasksCount,
      in_progress_tasks: inProgressTasksCount,
      review_tasks_Count: reviewTasksCount,
      overdue_TasksCount: overDueTasksCount,
      Todo_tasks_Count: newTasksCount,
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

    const finalResponse = {
      pagination_info: paginationInfo,
      records: result,
    };
    return sendSuccessResp(c, 200, DASHBOARD_FETCHED, finalResponse);
  };

  todaysTasksStatusCount = async (c: Context) => {
    const { todayStart, todayEnd } = getTodayDateRange();
    const todayStartISO = todayStart.toISOString();
    const todayEndISO = todayEnd.toISOString();

    const [completedTasksCount, inProgressTasksCount, reviewTasksCount, overDueTasksCount, newTasksCount, totalTasksCount]:
    [number, number, number, number, number, number] = await Promise.all([
      getRecordsCount(Tasks, [eq(Tasks.task_status, "COMPLETED"), lte(Tasks.start_date, todayEndISO), gte(Tasks.end_date, todayStartISO), isNull(Tasks.deleted_at)]),
      getRecordsCount(Tasks, [eq(Tasks.task_status, "IN_PROGRESS"), lte(Tasks.start_date, todayEndISO), gte(Tasks.end_date, todayStartISO), isNull(Tasks.deleted_at)]),
      getRecordsCount(Tasks, [eq(Tasks.task_status, "REVIEW"), lte(Tasks.start_date, todayEndISO), gte(Tasks.end_date, todayStartISO), isNull(Tasks.deleted_at)]),
      getRecordsCount(Tasks, [eq(Tasks.task_status, "OVERDUE"), lte(Tasks.start_date, todayEndISO), gte(Tasks.end_date, todayStartISO), isNull(Tasks.deleted_at)]),
      getRecordsCount(Tasks, [eq(Tasks.task_status, "TODO"), lte(Tasks.start_date, todayEndISO), gte(Tasks.end_date, todayStartISO), isNull(Tasks.deleted_at)]),
      getRecordsCount(Tasks, [lte(Tasks.start_date, todayEndISO), gte(Tasks.end_date, todayStartISO), isNull(Tasks.deleted_at)]),
    ]);

    return sendSuccessResp(c, 200, TODAY_TASKS_STATUS_COUNT_FETCHED, {
      total_tasks_count: totalTasksCount,
      completed_tasks: completedTasksCount,
      in_progress_tasks: inProgressTasksCount,
      review_tasks_Count: reviewTasksCount,
      overdue_TasksCount: overDueTasksCount,
      Todo_tasks_Count: newTasksCount,
    });
  };

  todayTasks = async (c: Context) => {
    const page = +c.req.query("page")! || 1;
    const pageSize = +c.req.query("page_size")! || 10;
    const taskStatus = c.req.query("task_status");
    const searchString = c.req.query("search_string");

    const { result, total_records } = await getTodayTasksWithUsersService(page, pageSize, taskStatus, searchString);

    const paginationInfo = getPaginationData(page, pageSize, total_records);

    const finalResponse = {
      pagination_info: paginationInfo,
      records: result,
    };

    return sendSuccessResp(c, 200, TODAY_TASKS_FETCHED, finalResponse);
  };
}

export default DashBoardController;
