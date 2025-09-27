import { and, desc, eq, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";

import { allowedTaskStatus } from "../constants/appMessages.js";
import { Tasks } from "../db/schema/tasks.js";
import { getRecordsCount } from "../services/db/baseDbService.js";
import { getUserAssignedTaskIds } from "../services/db/taskService.js";

export async function buildTaskFilters(search?: string, taskStatus?: any, startDate?: string, endDate?: string, user?: any) {
  const filters: any[] = [isNull(Tasks.deleted_at)];

  if (search?.trim()) {
    filters.push(sql`LOWER(${Tasks.task_title}) LIKE LOWER(${`%${search.trim()}%`})`);
  }

  if (taskStatus && allowedTaskStatus.includes(taskStatus.toUpperCase())) {
    filters.push(eq(Tasks.task_status, taskStatus.toUpperCase() as any));
  }

  if (user.user_type === "EMPLOYEE") {
    const taskIds = await getUserAssignedTaskIds(user.id);

    if (taskIds.length > 0) {
      filters.push(inArray(Tasks.id, taskIds));
    }
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
export function buildOrderByClauseTasks(orderBy?: string): any {
  if (!orderBy) {
    return desc(Tasks.created_at);
  }

  const [column, direction] = orderBy.split(":");
  const dir = direction?.toLowerCase() === "desc" ? "desc" : "asc";

  return dir === "desc"
    ? sql`${sql.identifier(column)} DESC`
    : sql`${sql.identifier(column)} ASC`;
}

export function getDateRange(daysBack: number, duration: number = 7) {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - daysBack);
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (duration - 1));
  startDate.setHours(0, 0, 0, 0);

  return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
}

export async function getTaskCounts(dateRange: { startDate: string; endDate: string }) {
  const conditions = [
    isNull(Tasks.deleted_at),
    gte(Tasks.created_at, new Date(dateRange.startDate)),
    lte(Tasks.created_at, new Date(dateRange.endDate)),
  ];

  const productiveConditions = or(
    eq(Tasks.task_status, "COMPLETED"),
    eq(Tasks.task_status, "DONE"),
    eq(Tasks.task_status, "IN_PROGRESS"),
  );

  const [productive, overdue, total] = await Promise.all([
    getRecordsCount(Tasks, [...conditions, productiveConditions]),
    getRecordsCount(Tasks, [...conditions, eq(Tasks.task_status, "OVERDUE")]),
    getRecordsCount(Tasks, conditions),
  ]);

  return { productive, overdue, total };
}

export function buildWeeklySummaryResponse(currentWeek: any, previousWeek: any) {
  const productivityPercentage = currentWeek.total > 0
    ? Math.round((currentWeek.productive / currentWeek.total) * 100)
    : 0;

  const calculateChange = (current: number, previous: number) =>
    previous > 0 ? Number(((current - previous) / previous * 100).toFixed(2)) : (current > 0 ? 100 : 0);

  return {
    productivity_percentage: productivityPercentage,
    productive_tasks: {
      count: currentWeek.productive,
      change_percentage: calculateChange(currentWeek.productive, previousWeek.productive),
      is_increase: currentWeek.productive >= previousWeek.productive,
    },
    overdue_tasks: {
      count: currentWeek.overdue,
      change_percentage: Math.abs(calculateChange(currentWeek.overdue, previousWeek.overdue)),
      is_increase: currentWeek.overdue >= previousWeek.overdue,
    },
    total_tasks: currentWeek.total,
  };
}
