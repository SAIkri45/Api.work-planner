import { and, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";

import { allowedTaskStatus } from "../constants/appMessages.js";
import { Tasks } from "../db/schema/tasks.js";

export function buildTaskFilters(search?: string, taskStatus?: any, startDate?: string, endDate?: string): any[] {
  const filters: any[] = [isNull(Tasks.deleted_at)];

  if (search?.trim()) {
    filters.push(sql`LOWER(${Tasks.task_title}) LIKE LOWER(${`%${search.trim()}%`})`);
  }

  if (taskStatus && allowedTaskStatus.includes(taskStatus.toUpperCase())) {
    filters.push(eq(Tasks.task_status, taskStatus.toUpperCase() as any));
  }

  // Date range filter
  if (startDate || endDate) {
    const dateFilters: any[] = [];

    if (startDate) {
      const startDateTime = new Date(`${startDate}T00:00:00`).toISOString();
      dateFilters.push(gte(Tasks.end_date, startDateTime));
    }

    if (endDate) {
      const endDateTime = new Date(`${endDate}T23:59:59`).toISOString();
      dateFilters.push(lte(Tasks.end_date, endDateTime));
    }

    if (dateFilters.length > 0) {
      filters.push(and(...dateFilters));
    }
  }

  return filters;
}
export function buildOrderByClause(orderBy?: string): any {
  if (!orderBy) {
    return desc(Tasks.created_at);
  }

  const [column, direction] = orderBy.split(":");
  const dir = direction?.toLowerCase() === "desc" ? "desc" : "asc";

  return dir === "desc"
    ? sql`${sql.identifier(column)} DESC`
    : sql`${sql.identifier(column)} ASC`;
}
