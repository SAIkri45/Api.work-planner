import { and, eq, inArray, isNull } from "drizzle-orm";

import type { UserProjects } from "../../db/schema/userProjects.js";

import { db } from "../../db/configuration.js";
import { user_projects } from "../../db/schema/userProjects.js";
import { users } from "../../db/schema/users.js";
import { saveRecords } from "./baseDbService.js";

export async function getProjectUsersById(id: number) {
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
          project_id: true,
          deleted_at: true,
        },
        where: (userProjects, { isNull, eq }) => and(
          isNull(userProjects.deleted_at),
          eq(userProjects.project_id, id),
        ),
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

  const users = result.userProjects
    ?.filter(userProject => userProject.users && userProject.users.deleted_at === null && userProject.users.user_status === "ACTIVE")
    .map(userProject => ({
      id: userProject.users!.id,
      display_name: userProject.users!.display_name,
      email: userProject.users!.email,
      user_type: userProject.users!.user_type,
      user_status: userProject.users!.user_status,
    }))
    ?? [];

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
