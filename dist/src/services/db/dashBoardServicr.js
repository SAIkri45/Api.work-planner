import { and, desc, ilike, isNull, sql } from "drizzle-orm";
import { db } from "../../db/configuration.js";
import { task_assignees } from "../../db/schema/taskAssignees.js";
import { Tasks } from "../../db/schema/tasks.js";
import { users } from "../../db/schema/users.js";
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
                    task_id: true,
                },
                where: isNull(task_assignees.deleted_at),
                with: {
                    task: {
                        where: isNull(Tasks.deleted_at),
                        columns: {
                            id: true,
                            task_status: true,
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
        const statusCounts = {
            NEW: 0,
            IN_PROGRESS: 0,
            COMPLETED: 0,
            REVIEW: 0,
            PENDING: 0,
        };
        let totalTasks = 0;
        user.task_assignees.forEach((assignee) => {
            if (assignee.task && assignee.task.task_status) {
                const status = assignee.task.task_status;
                if (statusCounts.hasOwnProperty(status)) {
                    statusCounts[status]++;
                }
                totalTasks++;
            }
        });
        return {
            id: user.id,
            display_name: user.display_name,
            total_tasks: totalTasks,
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
