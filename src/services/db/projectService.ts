import { and, eq, ilike, inArray, isNull, not } from "drizzle-orm";

import type { UserProjects } from "../../db/schema/userProjects.js";

import { db } from "../../db/configuration.js";
import { projects } from "../../db/schema/projects.js";
import { user_projects } from "../../db/schema/userProjects.js";
import { users } from "../../db/schema/users.js";
import { saveRecords } from "./baseDbService.js";

export async function getProjectUsersById(id: number, search?: string) {
  const result = await db.query.projects.findFirst({
    columns: {
      id: true,
      title: true,
      description: true,
      logo_url: true,
      project_status: true,
    },
    with: {
      userProjects: {
        columns: {
          deleted_at: true,
        },
        where: (userProjects, { isNull }) => isNull(userProjects.deleted_at),
        with: {
          users: {
            columns: {
              id: true,
              display_name: true,
              email: true,
              user_type: true,
              user_status: true,
              deleted_at: true,
            },
          },
        },
      },
    },
    where: (projects, { eq }) => eq(projects.id, id),
  });

  if (!result)
    return null;

  let users = result.userProjects
    ?.filter(userProject =>
      userProject.users
      && userProject.users.deleted_at === null
      && userProject.users.user_status === "ACTIVE",
    )
    .map(userProject => ({
      id: userProject.users!.id,
      display_name: userProject.users!.display_name,
      email: userProject.users!.email,
      user_type: userProject.users!.user_type,
      user_status: userProject.users!.user_status,
    }))
    ?? [];

  if (search && search.trim()) {
    const searchTerm = search.trim();
    users = users.filter(user =>
      user.display_name?.includes(searchTerm),
    );
  }

  return {
    id: result.id,
    title: result.title,
    description: result.description,
    logo_url: result.logo_url,
    project_status: result.project_status,
    users,
  };
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
    .where(eq(user_projects.project_id, projectId));

  return [...new Set(existingUserProjects.map(record => record.user_ids))];
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

// users dropdown to remove from project
export async function getProjectUsersByIdDropdown(id: number, search?: string) {
  const result = await db.query.projects.findFirst({
    columns: {
      id: true,
      title: true,
      description: true,
      logo_url: true,
      project_status: true,
    },
    with: {
      userProjects: {
        columns: {
          deleted_at: true,
        },
        where: (userProjects, { isNull }) => isNull(userProjects.deleted_at),
        with: {
          users: {
            columns: {
              id: true,
              display_name: true,
              user_status: true,
              deleted_at: true,
            },
          },
        },
      },
    },
    where: (projects, { eq }) => eq(projects.id, id),
  });

  if (!result)
    return null;

  let users
    = result.userProjects
      ?.filter(
        userProject =>
          userProject.users
          && userProject.users.deleted_at === null
          && userProject.users.user_status === "ACTIVE",
      )
      .map(userProject => ({
        id: userProject.users!.id,
        display_name: userProject.users!.display_name,
      })) ?? [];

  if (search && search.trim()) {
    const searchTerm = search.trim();
    users = users.filter(user =>
      user.display_name?.includes(searchTerm),
    );
  }

  return {
    id: result.id,
    title: result.title,
    users,
  };
}

export async function getNonExistingUsers(projectId: number, search?: string) {
  const project = await db.query.projects.findFirst({
    columns: { id: true },
    with: {
      userProjects: {
        columns: { user_id: true },
        where: isNull(user_projects.deleted_at),
      },
    },
    where: eq(projects.id, projectId),
  });

  const assignedIds = project?.userProjects?.map((up: { user_id: number | null }) => up.user_id).filter((id): id is number => id !== null) || [];

  // Build conditions
  const conditions = [
    isNull(users.deleted_at),
    eq(users.user_status, "ACTIVE"),
  ];

  if (assignedIds.length > 0) {
    conditions.push(not(inArray(users.id, assignedIds)));
  }

  if (search?.trim()) {
    conditions.push(ilike(users.display_name, `%${search.trim()}%`));
  }

  // Get non-existing users
  return await db
    .select({
      id: users.id,
      display_name: users.display_name,
    })
    .from(users)
    .where(and(...conditions));
}
