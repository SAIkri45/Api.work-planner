import { desc, eq, isNull, sql } from "drizzle-orm";
import { allowedTaskStatus } from "../constants/appMessages.js";
import { Tasks } from "../db/schema/tasks.js";
export function buildTaskFilters(search, taskStatus) {
    const filters = [isNull(Tasks.deleted_at)];
    if (search?.trim()) {
        filters.push(sql `LOWER(${Tasks.task_title}) LIKE LOWER(${`%${search.trim()}%`})`);
    }
    if (taskStatus && allowedTaskStatus.includes(taskStatus.toUpperCase())) {
        filters.push(eq(Tasks.task_status, taskStatus.toUpperCase()));
    }
    return filters;
}
export function buildOrderByClause(orderBy) {
    if (!orderBy) {
        return desc(Tasks.created_at);
    }
    const [column, direction] = orderBy.split(":");
    const dir = direction?.toLowerCase() === "desc" ? "desc" : "asc";
    return dir === "desc"
        ? sql `${sql.identifier(column)} DESC`
        : sql `${sql.identifier(column)} ASC`;
}
