import { eq, gte, isNull, lte } from "drizzle-orm";
import { DASHBOARD_FETCHED, TODAY_TASKS_FETCHED, TODAY_TASKS_STATUS_COUNT_FETCHED } from "../constants/appMessages.js";
import { Tasks } from "../db/schema/tasks.js";
import { getTodayDateRange } from "../helpers/dashBoardhelper.js";
import { getPaginationData } from "../helpers/paginationHelper.js";
import { getRecordsConditionally, getRecordsCount } from "../services/db/baseDbService.js";
import { getUserTaskStatisticsWithPagination } from "../services/db/dashBoardService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
class DashBoardController {
    getDashboardStatus = async (c) => {
        const [completedTasksCount, inProgressTasksCount, reviewTasksCount, overDueTasksCount, newTasksCount, totalTasksCount] = await Promise.all([
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
    overAllStatistics = async (c) => {
        const page = +(c.req.query("page") || 1);
        const pageSize = +(c.req.query("page_size") || 10);
        const offset = (page - 1) * pageSize;
        const search = c.req.query("search_string");
        const orderBy = c.req.query("order_by");
        const { total_records, result } = await getUserTaskStatisticsWithPagination(offset, pageSize, search, orderBy);
        const paginationInfo = getPaginationData(page, pageSize, total_records);
        const finalResponse = {
            pagination_info: paginationInfo,
            records: result,
        };
        return sendSuccessResp(c, 200, DASHBOARD_FETCHED, finalResponse);
    };
    todayTasks = async (c) => {
        const taskStatus = c.req.query("task_status")?.toLocaleUpperCase();
        const startDate = c.req.query("from_date");
        const endDate = c.req.query("to_date");
        const orderByQueryData = {
            columns: ["created_at"],
            values: ["desc"],
        };
        const whereQueryData = {
            columns: ["deleted_at"],
            values: [null],
        };
        // Add today's date filter for created_at
        const { todayStart, todayEnd } = getTodayDateRange();
        whereQueryData.columns.push("created_at");
        whereQueryData.values.push({
            gte: todayStart,
            lte: todayEnd,
        });
        if (taskStatus) {
            whereQueryData.columns.push("task_status");
            whereQueryData.values.push(taskStatus);
        }
        if (startDate || endDate) {
            whereQueryData.columns.push("end_date");
            const dateFilter = {};
            if (startDate)
                dateFilter.gte = new Date(`${startDate}T00:00:00`);
            if (endDate)
                dateFilter.lte = new Date(`${endDate}T23:59:59`);
            whereQueryData.values.push(dateFilter);
        }
        const result = await getRecordsConditionally(Tasks, whereQueryData, ["id", "task_title", "task_status", "start_date", "end_date"], orderByQueryData);
        return sendSuccessResp(c, 200, TODAY_TASKS_FETCHED, result);
    };
    todaysTasksStatusCount = async (c) => {
        const { todayStart, todayEnd } = getTodayDateRange();
        const [completedTasksCount, inProgressTasksCount, reviewTasksCount, overDueTasksCount, newTasksCount, totalTasksCount] = await Promise.all([
            getRecordsCount(Tasks, [eq(Tasks.task_status, "COMPLETED"), gte(Tasks.created_at, todayStart), lte(Tasks.created_at, todayEnd), isNull(Tasks.deleted_at)]),
            getRecordsCount(Tasks, [eq(Tasks.task_status, "IN_PROGRESS"), gte(Tasks.created_at, todayStart), lte(Tasks.created_at, todayEnd), isNull(Tasks.deleted_at)]),
            getRecordsCount(Tasks, [eq(Tasks.task_status, "REVIEW"), gte(Tasks.created_at, todayStart), lte(Tasks.created_at, todayEnd), isNull(Tasks.deleted_at)]),
            getRecordsCount(Tasks, [eq(Tasks.task_status, "OVERDUE"), gte(Tasks.created_at, todayStart), lte(Tasks.created_at, todayEnd), isNull(Tasks.deleted_at)]),
            getRecordsCount(Tasks, [eq(Tasks.task_status, "NEW"), gte(Tasks.created_at, todayStart), lte(Tasks.created_at, todayEnd), isNull(Tasks.deleted_at)]),
            getRecordsCount(Tasks, [gte(Tasks.created_at, todayStart), lte(Tasks.created_at, todayEnd), isNull(Tasks.deleted_at)]),
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
