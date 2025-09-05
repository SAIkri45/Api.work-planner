import { and, desc, ilike, isNull, sql } from "drizzle-orm";

import type { UserTaskInfo } from "../../types/appTypes.js";

import { db } from "../../db/configuration.js";
import { task_assignees } from "../../db/schema/taskAssignees.js";
import { Tasks } from "../../db/schema/tasks.js";
import { users } from "../../db/schema/users.js";

export async function getUserTaskStatisticsWithPagination(
  offset?: number,
  pageSize?: number,
  search?: string,
  orderBy?: string,
) {
  const filters: any[] = [isNull(users.deleted_at)];

  if (search?.trim()) {
    filters.push(ilike(users.display_name, `%${search.trim()}%`));
  }

  let orderByClause;
  if (orderBy) {
    const [column, direction] = orderBy.split(":");
    const dir = direction?.toLowerCase() === "desc" ? "desc" : "asc";
    orderByClause = dir === "desc"
      ? sql`${sql.identifier(column)} DESC`
      : sql`${sql.identifier(column)} ASC`;
  }
  else {
    orderByClause = desc(users.created_at);
  }

  const result: any = await db.query.users.findMany({
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
  } as any);

  const totalCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(and(...filters));

  const total_records = totalCountResult[0].count;

  const processedResult: UserTaskInfo[] = result.map((user: any) => {
    const validTasks = user.task_assignees
      .filter((assignee: any) => assignee.task && assignee.task.task_status)
      .map((assignee: any) => assignee.task.task_status);

    const statusCounts = {
      NEW: validTasks.filter((status: string) => status === "NEW").length,
      IN_PROGRESS: validTasks.filter((status: string) => status === "IN_PROGRESS").length,
      COMPLETED: validTasks.filter((status: string) => status === "COMPLETED").length,
      REVIEW: validTasks.filter((status: string) => status === "REVIEW").length,
      PENDING: validTasks.filter((status: string) => status === "PENDING").length,
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

  console.log("result", JSON.stringify(result, null, 2));

  console.log("processedResult", processedResult);

  return {
    result: processedResult,
    total_records,
  };
}
