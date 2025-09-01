import { and, desc, eq, exists, ilike, inArray, isNull, not, sql } from "drizzle-orm";

import type { UserProjects } from "../../db/schema/userProjects.js";

import { allowedTaskStatus } from "../../constants/appMessages.js";
import { db } from "../../db/configuration.js";
import { projects } from "../../db/schema/projects.js";
import { Tasks } from "../../db/schema/tasks.js";
import { user_projects } from "../../db/schema/userProjects.js";
import { users } from "../../db/schema/users.js";
import ConflictException from "../../exceptions/conflictException.js";
import { saveRecords } from "./baseDbService.js";

export async function getProjectUsersById(id: number, search?: string) {
  const searchString = search?.trim();
  const result: any = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), isNull(projects.deleted_at)),
    columns: {
    },
    with: {
      userProjects: {
        where: and(isNull(user_projects.deleted_at), eq(user_projects.project_id, id)),
        with: {
          users: {
            where: and(
              isNull(users.deleted_at),
              eq(users.user_status, "ACTIVE"),
              searchString ? ilike(users.display_name, `%${searchString}%`) : undefined,
            ),
            columns: {
              id: true,
              display_name: true,
              user_status: true,
              user_type: true,
              profile_pic: true,
              designation: true,
            },
          },
        },
      },
    },
  } as any);

  const usersList = result?.userProjects
    ?.filter((userProject: any) => userProject.users !== null)
    ?.map((userProject: any) => ({
      id: userProject.users.id,
      display_name: userProject.users.display_name,
      user_status: userProject.users.user_status,
      user_type: userProject.users.user_type,
      profile_pic: userProject.users.profile_pic,
      designation: userProject.users.designation,
    })) ?? [];

  return usersList;
}
export async function insertUsersToProject(projectId: number, userIds: number[]) {
  if (!userIds.length)
    return [];

  const userProjectRecords = userIds.map((userId: number) => ({
    project_id: projectId,
    user_id: userId,
  }));

  await saveRecords<UserProjects>(user_projects, userProjectRecords);

  return userProjectRecords;
}

export async function checkedUsersInProject(projectId: number) {
  const existingUserProjects = await db
    .select({ user_ids: user_projects.user_id })
    .from(user_projects)
    .where(and(
      eq(user_projects.project_id, projectId),
      isNull(user_projects.deleted_at),
    ));
  return [...new Set(existingUserProjects.map(record => record.user_ids))];
}

// New helper function to get ALL users in project (active + soft-deleted)
export async function getAllUsersInProject(projectId: number) {
  const allUserProjects = await db
    .select({ user_ids: user_projects.user_id })
    .from(user_projects)
    .where(eq(user_projects.project_id, projectId)); // No deleted_at filter

  return [...new Set(allUserProjects.map(record => record.user_ids))];
}
export async function validateUsersExist(userIds: number[]) {
  const existingUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(inArray(users.id, userIds));

  return existingUsers.map(user => user.id);
}

export async function removeUsersFromProject(projectId: number, userIds: number[]) {
  const result = await db
    .update(user_projects)
    .set({
      deleted_at: new Date(),
    })
    .where(and(
      eq(user_projects.project_id, projectId),
      inArray(user_projects.user_id, userIds),
      isNull(user_projects.deleted_at),
    ));

  return result;
}

// Get project users for dropdown with improved filtering and null checks
export async function getProjectUsersByIdDropdown(id: number, search?: string) {
  const searchString = search?.trim();
  const result: any = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), isNull(projects.deleted_at)),
    columns: {},
    with: {
      userProjects: {
        columns: {},
        where: and(
          eq(user_projects.project_id, id),
          isNull(user_projects.deleted_at),
        ),
        with: {
          users: {
            where: and(
              isNull(users.deleted_at),
              eq(users.user_status, "ACTIVE"),
              searchString ? ilike(users.display_name, `%${searchString}%`) : undefined,
            ),
            columns: {
              id: true,
              display_name: true,
            },
          },
        },
      },
    },
  } as any);

  const usersList = result?.userProjects
    ?.filter((userProject: any) => userProject.users !== null)
    ?.map((userProject: any) => ({
      id: userProject.users.id,
      display_name: userProject.users.display_name,
    })) ?? [];

  return usersList;
}

export async function getNonExistingUsers(projectId: number, search?: string) {
  const searchTerm = search?.trim();

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
        not(
          exists(
            db
              .select()
              .from(user_projects)
              .where(
                and(
                  eq(user_projects.user_id, users.id),
                  eq(user_projects.project_id, projectId),
                  isNull(user_projects.deleted_at),
                ),
              ),
          ),
        ),
        searchTerm ? ilike(users.display_name, `%${searchTerm}%`) : undefined,
      ),
    );
}

export async function assignUsersToProject(projectId: number, uniqueUserIds: number[]) {
  const [activeUserIds, allUserIds] = await Promise.all([
    checkedUsersInProject(projectId),
    getAllUsersInProject(projectId),
  ]);

  const activeSet = new Set(activeUserIds);
  const allUsersSet = new Set(allUserIds);

  const alreadyActiveUsers = uniqueUserIds.filter(id => activeSet.has(id));

  if (alreadyActiveUsers.length > 0) {
    throw new ConflictException(`Users already exist in project: ${alreadyActiveUsers.join(", ")}`);
  }

  const softDeletedUsers = uniqueUserIds.filter(
    id => !activeSet.has(id) && allUsersSet.has(id),
  );

  const newUsers = uniqueUserIds.filter(id => !allUsersSet.has(id));

  const usersToInsert = [...softDeletedUsers, ...newUsers];

  const result = [];

  if (usersToInsert.length > 0) {
    const insertedRecords = await insertUsersToProject(projectId, usersToInsert);
    result.push(...insertedRecords);
  }

  return {
    assigned_users: result,
  };
}

export async function getTasksByProjectId(
  projectId: number,
  search?: string,
  offset?: number,
  pageSize?: number,
  orderBy?: string,
  taskStatus?: any,
  dueDate?: string,
) {
  const filters: any[] = [
    eq(Tasks.project_id, projectId),
    isNull(Tasks.deleted_at),
  ];

  if (search?.trim()) {
    filters.push(ilike(Tasks.task_title, `%${search.trim()}%`));
  }

  if (taskStatus && allowedTaskStatus.includes(taskStatus.toUpperCase())) {
    filters.push(eq(Tasks.task_status, taskStatus.toUpperCase() as any));
  }

  if (dueDate) {
    const dueDateObj = new Date(dueDate);
    filters.push(eq(Tasks.end_date, dueDateObj));
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
    orderByClause = desc(Tasks.created_at);
  }

  const result = await db.query.Tasks.findMany({
    where: and(...filters),
    orderBy: orderByClause,
    offset,
    limit: pageSize,
    columns: {
      id: true,
      task_title: true,
      task_status: true,
      end_date: true,
      created_at: true,
    },
  });

  const total_records = (await db
    .select({ count: sql<number>`count(*)` })
    .from(Tasks)
    .where(and(...filters)))[0]?.count || 0;

  const tasks = result.map(task => ({
    id: task.id,
    task_title: task.task_title,
    task_status: task.task_status,
    end_date: task.end_date,
    created_at: task.created_at,
  }));

  return { result: tasks, total_records };
}

export async function getProjectTaskStatusCounts(projectId: number) {
  const result = await db
    .select({
      total_count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
      completed_count: sql<number>`CAST(COUNT(*) FILTER (WHERE ${Tasks.task_status} = 'COMPLETED') AS INTEGER)`,
      inProgress_count: sql<number>`CAST(COUNT(*) FILTER (WHERE ${Tasks.task_status} = 'IN_PROGRESS') AS INTEGER)`,
      new_count: sql<number>`CAST(COUNT(*) FILTER (WHERE ${Tasks.task_status} = 'NEW') AS INTEGER)`,
      review_count: sql<number>`CAST(COUNT(*) FILTER (WHERE ${Tasks.task_status} = 'REVIEW') AS INTEGER)`,
      overdue_count: sql<number>`CAST(COUNT(*) FILTER (WHERE ${Tasks.task_status} = 'OVERDUE') AS INTEGER)`,
      done_count: sql<number>`CAST(COUNT(*) FILTER (WHERE ${Tasks.task_status} = 'DONE') AS INTEGER)`,
    })
    .from(Tasks)
    .where(and(
      eq(Tasks.project_id, projectId),
      isNull(Tasks.deleted_at),
    ))
    .groupBy(Tasks.project_id);

  return result[0];
}


export async function userCreatedProjectById(projectId: number) {
  const result = await db.query.projects.findFirst({
    where: and(eq(projects.id, projectId), isNull(projects.deleted_at)),
    columns: {
      id: true,
      title: true,
      description: true,
      logo_url: true,
      project_status: true,
      created_by: true,
      updated_by: true,
      start_date: true,
      due_date: true,
    },
    with: {
      createdByUser: {
        columns: {
          display_name: true,
          profile_pic: true,
        },
      },
    },
  });

  if (!result) {
    return null;
  }

  return result;
}