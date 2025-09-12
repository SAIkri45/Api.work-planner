import { desc, eq, ilike, isNull, sql } from "drizzle-orm";

import { allowedTaskStatus } from "../constants/appMessages.js";
import { Tasks } from "../db/schema/tasks.js";

export function buildTaskFilters(search?: string, taskStatus?: any): any[] {
  const filters: any[] = [isNull(Tasks.deleted_at)];

  if (search?.trim()) {
    console.log("Adding search filter for:", search.trim()); // Add this too
    filters.push(ilike(Tasks.task_title, `%${search.trim()}%`));
  }

  if (taskStatus && allowedTaskStatus.includes(taskStatus.toUpperCase())) {
    filters.push(eq(Tasks.task_status, taskStatus.toUpperCase() as any));
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
