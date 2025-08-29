import { eq, isNull } from "drizzle-orm";
import { DASHBOARD_FETCHED } from "../constants/appMessages.js";
import { Tasks } from "../db/schema/tasks.js";
import { getRecordsCount } from "../services/db/baseDbService.js";
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
}
export default DashBoardController;
