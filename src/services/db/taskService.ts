import { and, desc, eq, exists, ilike, isNull, not, sql } from "drizzle-orm";

import type { TaskAssignees } from "../../db/schema/taskAssignees.js";
import type { Task } from "../../db/schema/tasks.js";

import { TASK_NOT_FOUND } from "../../constants/appMessages.js";
import { db } from "../../db/configuration.js";
import { projects } from "../../db/schema/projects.js";
import { task_assignees } from "../../db/schema/taskAssignees.js";
import { Tasks } from "../../db/schema/tasks.js";
import { user_projects } from "../../db/schema/userProjects.js";
import { users } from "../../db/schema/users.js";
import BadRequestException from "../../exceptions/badRequestException.js";
import ConflictException from "../../exceptions/conflictException.js";
import NotFoundException from "../../exceptions/notFoundException.js";
import { buildOrderByClauseTasks, buildTaskFilters } from "../../helpers/taskhelper.js";
import { getSingleRecordByMultipleColumnValues, saveRecords } from "./baseDbService.js";
import { getAllUsersInProject } from "./projectService.js";

export async function gatAllTaskList(offset?: number, pageSize?: number, search?: string, orderBy?: string, taskStatus?: any, startDate?: string, endDate?: string, user?: any) {
  const filters = await buildTaskFilters(search, taskStatus, startDate, endDate, user);
  const orderByClause = buildOrderByClauseTasks(orderBy);

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

// // active + soft-deleted
export async function getAllTaskAssignees(taskId: number) {
  const allAssignees = await db
    .select({ user_id: task_assignees.user_id })
    .from(task_assignees)
    .where(and(
      eq(task_assignees.task_id, taskId),
      isNull(task_assignees.deleted_at),
    ));
  return [...new Set(allAssignees.map(record => record.user_id))];
}

// Core function to assign users to task
export async function assignUsersToTask(taskId: number, uniqueUserIds: number[]) {
  if (!uniqueUserIds.length)
    return [];

  // Get task and validate it exists
  const task = await getSingleRecordByMultipleColumnValues<Task>(Tasks, ["id", "deleted_at"], [taskId, null], ["id", "project_id", "task_title"]);

  if (!task) {
    throw new NotFoundException(TASK_NOT_FOUND);
  }

  if (!task.project_id) {
    throw new BadRequestException("Task is not associated with any project");
  }

  // Get project users and task assignees in parallel
  const [projectUserIds, taskAssignees] = await Promise.all([
    getAllUsersInProject(task.project_id),
    getAllTaskAssignees(taskId),
  ]);

  const projectUsersSet = new Set(projectUserIds);
  const assigneesSet = new Set(taskAssignees);

  // Validate all users exist in project
  const usersNotInProject = uniqueUserIds.filter(id => !projectUsersSet.has(id));
  if (usersNotInProject.length > 0) {
    throw new BadRequestException(`Users not found in project: ${usersNotInProject.join(", ")}`);
  }

  // Check for already assigned users
  const alreadyAssignedUsers = uniqueUserIds.filter(id => assigneesSet.has(id));
  if (alreadyAssignedUsers.length > 0) {
    throw new ConflictException(`Users already assigned to task: ${alreadyAssignedUsers.join(", ")}`);
  }

  // Create assignee records
  const assigneeRecords = uniqueUserIds.map(user_id => ({
    task_id: taskId,
    user_id,
    task_title: task.task_title,
  }));

  // Insert records
  return await saveRecords<TaskAssignees>(task_assignees, assigneeRecords);
}

export async function usersByTaskIdDropdown(taskId: number, search?: string) {
  const searchString = search?.trim().toLowerCase();
  const result: any = await db.query.Tasks.findFirst({
    where: and(eq(Tasks.id, taskId), isNull(Tasks.deleted_at)),
    columns: {},
    with: {
      assignees: {
        columns: {},
        where: and(
          eq(task_assignees.task_id, taskId),
          isNull(task_assignees.deleted_at),

        ),
        with: {
          user: {
            where: and(
              isNull(users.deleted_at),
              eq(users.user_status, "ACTIVE"),
              searchString ? ilike(users.display_name, `%${searchString}%`) : undefined,
            ),
            orderBy: desc(users.id),
            columns: {
              id: true,
              display_name: true,
            },

          },
        },
      },
    },

  } as any);

  const assignedUsers = result?.assignees
    ?.map((assignee: any) => assignee.user)
    .filter((user: any) => user !== null) || [];

  return assignedUsers;
}

export async function getUnassignedUsersForTask(taskId: number, search?: string) {
  const searchTerm = search?.trim();

  // First get the project_id for the task
  const task = await db.query.Tasks.findFirst({
    where: and(eq(Tasks.id, taskId), isNull(Tasks.deleted_at)),
    columns: {
      project_id: true,
    },
  });

  if (!task?.project_id) {
    return [];
  }

  return await db
    .select({
      id: users.id,
      display_name: users.display_name,
    })
    .from(users)
    .where(
      and(
        isNull(users.deleted_at),
        eq(users.user_status, "ACTIVE"),
        // User must be in the project
        exists(
          db
            .select()
            .from(user_projects)
            .where(
              and(
                eq(user_projects.user_id, users.id),
                eq(user_projects.project_id, task.project_id),
                isNull(user_projects.deleted_at),
              ),
            ),
        ),
        // But NOT assigned to this task
        not(
          exists(
            db
              .select()
              .from(task_assignees)
              .where(
                and(
                  eq(task_assignees.user_id, users.id),
                  eq(task_assignees.task_id, taskId),
                  isNull(task_assignees.deleted_at),
                ),
              ),
          ),
        ),
        searchTerm ? ilike(users.display_name, `%${searchTerm}%`) : undefined,
      ),
    )
    .orderBy(desc(users.display_name));
}

export async function getUserAssignedTaskIds(userId: number): Promise<number[]> {
  const userTasks = await db
    .select({ task_id: task_assignees.task_id })
    .from(task_assignees)
    .where(
      and(
        eq(task_assignees.user_id, userId),
        isNull(task_assignees.deleted_at),
      ),
    );
  return userTasks.map(up => up.task_id).filter(id => id !== null) as number[];
}
