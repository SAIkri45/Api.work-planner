import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../../db/configuration.js";
import { projects } from "../../db/schema/projects.js";
import { user_projects } from "../../db/schema/userProjects.js";
import { users } from "../../db/schema/users.js";
import { saveRecords } from "./baseDbService.js";
export async function getProjectUsersById(id) {
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
                columns: {},
                with: {
                    users: {
                        columns: {
                            id: true,
                            display_name: true,
                            email: true,
                            user_type: true,
                            user_status: true,
                        },
                    },
                },
            },
        },
        where: eq(projects.id, id),
    });
    if (!result)
        return null;
    const users = result.userProjects
        ?.map(userProject => userProject.users)
        .filter(Boolean)
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
// export async function insertUsersToProject(projectId: number, userIds: number[]) {
//   const userProjectRecords = userIds.map((userId: number) => ({
//     project_id: projectId,
//     user_id: userId,
//   }));
//   console.log("userProjectRecords: ", userProjectRecords);
//   await saveRecords<UserProjects>(user_projects, userProjectRecords);
//   return userProjectRecords;
// }
export async function insertUsersToProject(projectId, userIds) {
    if (!userIds.length)
        return [];
    const userProjectRecords = userIds.map((userId) => ({
        project_id: projectId,
        user_id: userId,
    }));
    await saveRecords(user_projects, userProjectRecords);
    return userProjectRecords;
}
export async function checkedUsersInProject(projectId) {
    const existingUserProjects = await db
        .select({ user_ids: user_projects.user_id })
        .from(user_projects)
        .where(eq(user_projects.project_id, projectId));
    return [...new Set(existingUserProjects.map(record => record.user_ids))];
}
export async function validateUsersExist(userIds) {
    const existingUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.id, userIds));
    return existingUsers.map(user => user.id);
}
export async function removeUsersFromProject(projectId, userIds) {
    const result = await db
        .update(user_projects)
        .set({
        deleted_at: new Date(),
    })
        .where(and(eq(user_projects.project_id, projectId), inArray(user_projects.user_id, userIds), isNull(user_projects.deleted_at)));
    return result;
}
