import { and, desc, eq, gte, ilike, isNull, like, lte, sql } from "drizzle-orm";
import { db } from "../../db/configuration.js";
import { task_assignees } from "../../db/schema/taskAssignees.js";
import { Tasks } from "../../db/schema/tasks.js";
import { users } from "../../db/schema/users.js";
import { getTodayDateRangeIst } from "../../helpers/dashBoardhelper.js";
export async function getUserTaskStatisticsWithPagination(offset, pageSize, search, orderBy) {
    const filters = [isNull(users.deleted_at)];
    if (search?.trim()) {
        filters.push(ilike(users.display_name, `%${search.trim()}%`));
    }
    let orderByClause;
    if (orderBy) {
        const [column, direction] = orderBy.split(":");
        const dir = direction?.toLowerCase() === "desc" ? "desc" : "asc";
        orderByClause = dir === "desc"
            ? sql `${sql.identifier(column)} DESC`
            : sql `${sql.identifier(column)} ASC`;
    }
    else {
        orderByClause = desc(users.created_at);
    }
    // Fetch users with task assignments
    const result = await db.query.users.findMany({
        where: and(...filters),
        orderBy: orderByClause,
        offset,
        limit: pageSize,
        columns: {
            id: true,
            display_name: true,
        },
        with: {
            task_assignees: {
                columns: {
                    task_id: true, // include only task_id from the join table
                },
                where: isNull(task_assignees.deleted_at),
                with: {
                    task: {
                        columns: {
                            id: true,
                            task_status: true,
                            deleted_at: true,
                        },
                    },
                },
            },
        },
    });
    const totalCountResult = await db
        .select({ count: sql `count(*)` })
        .from(users)
        .where(and(...filters));
    const total_records = totalCountResult[0].count;
    const processedResult = result.map((user) => {
        const validTasks = user.task_assignees
            .filter(assignee => assignee.task && !assignee.task.deleted_at)
            .map(assignee => assignee.task?.task_status);
        const statusCounts = {
            NEW: validTasks.filter((status) => status === "TODO").length,
            IN_PROGRESS: validTasks.filter((status) => status === "IN_PROGRESS").length,
            COMPLETED: validTasks.filter((status) => status === "COMPLETED").length,
            REVIEW: validTasks.filter((status) => status === "REVIEW").length,
            PENDING: validTasks.filter((status) => status === "PENDING").length,
        };
        return {
            id: user.id,
            display_name: user.display_name,
            total_tasks: validTasks.length,
            new_tasks: statusCounts.NEW,
            in_progress_tasks: statusCounts.IN_PROGRESS,
            completed_tasks: statusCounts.COMPLETED,
            review_tasks: statusCounts.REVIEW,
            pending_tasks: statusCounts.PENDING,
        };
    });
    return {
        result: processedResult,
        total_records,
    };
}
export async function getTodayTasksWithUsersService(page, pageSize, taskStatus, searchString) {
    const { todayStart, todayEnd } = getTodayDateRangeIst();
    const offset = (page - 1) * pageSize;
    const todayStartStr = todayStart.toISOString(); // 'YYYY-MM-DDTHH:MM:SS.sssZ'
    const todayEndStr = todayEnd.toISOString();
    const conditions = [isNull(Tasks.deleted_at)];
    conditions.push(and(lte(Tasks.start_date, todayEndStr), gte(Tasks.end_date, todayStartStr)));
    const validStatuses = ["TODO", "IN_PROGRESS", "COMPLETED", "REVIEW", "OVERDUE"];
    if (taskStatus && validStatuses.includes(taskStatus)) {
        conditions.push(eq(Tasks.task_status, taskStatus));
    }
    if (searchString?.trim())
        conditions.push(like(Tasks.task_title, `%${searchString.trim()}%`));
    const totalCountResult = await db
        .select({ count: sql `count(*)` })
        .from(Tasks)
        .where(and(...conditions));
    const totalRecords = totalCountResult[0]?.count || 0;
    const tasks = await db.query.Tasks.findMany({
        where: and(...conditions),
        limit: pageSize,
        offset,
        with: {
            assignees: {
                columns: {},
                with: {
                    user: {
                        columns: {
                            id: true,
                            display_name: true,
                        },
                    },
                },
            },
        },
    });
    const mapped_tasks = tasks.map(task => ({
        id: task.id,
        task_title: task.task_title,
        task_status: task.task_status,
        start_date: task.start_date,
        end_date: task.end_date,
        created_at: task.created_at,
        users: task.assignees?.map(a => a.user) || [],
    }));
    return {
        result: mapped_tasks,
        total_records: totalRecords,
    };
}
