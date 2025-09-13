import { and, isNull, sql } from "drizzle-orm";

import { db } from "../../db/configuration.js";
import { projects } from "../../db/schema/projects.js";
import { Tasks } from "../../db/schema/tasks.js";
import { buildOrderByClause } from "../../helpers/projectHelper.js";
import { buildTaskFilters } from "../../helpers/taskhelper.js";

export async function gatAllTaskList(offset?: number, pageSize?: number, search?: string, orderBy?: string, taskStatus?: any, startDate?: string, endDate?: string) {
  const filters = buildTaskFilters(search, taskStatus, startDate, endDate);
  const orderByClause = buildOrderByClause(orderBy);

  const result: any = await db.query.Tasks.findMany({
    where: and(...filters),
    orderBy: orderByClause,
    offset,
    limit: pageSize,
    columns: {
      id: true,
      task_title: true,
      description: true,
      task_status: true,
      start_date: true,
      end_date: true,
    },
    with: {
      project: {
        where: isNull(projects.deleted_at),
        columns: {
          id: true,
          title: true,
        },
      },
    },
  } as any);

  const total_records = (await db
    .select({ count: sql<number>`count(*)` })
    .from(Tasks)
    .where(and(...filters)))[0]?.count || 0;

  return { result, total_records };
}
