import { and, eq, exists, ilike, inArray, isNotNull, isNull, not } from "drizzle-orm";

import type { UserProjects } from "../../db/schema/userProjects.js";

import { db } from "../../db/configuration.js";
import { projects } from "../../db/schema/projects.js";
import { user_projects } from "../../db/schema/userProjects.js";
import { users } from "../../db/schema/users.js";
import ConflictException from "../../exceptions/conflictException.js";
import { saveRecords } from "./baseDbService.js";

export async function getProjectUsersById(id: number, search?: string) {
  const searchString = search?.trim();
  const result: any = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), isNull(projects.deleted_at)),
    columns: {
      id: true,
      title: true,
      project_status: true,
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

// helper to reactivate previously soft-deleted users
export async function reactivateUsersInProject(projectId: number, userIds: number[]) {
  if (userIds.length === 0)
    return [];

  return db
    .update(user_projects)
    .set({ deleted_at: null, updated_at: new Date() })
    .where(
      and(
        eq(user_projects.project_id, projectId),
        inArray(user_projects.user_id, userIds),
        isNotNull(user_projects.deleted_at),
      ),
    )
    .returning();
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
