import { and, eq, ilike, inArray, isNull, not } from "drizzle-orm";
import { db } from "../../db/configuration.js";
import { projects } from "../../db/schema/projects.js";
import { user_projects } from "../../db/schema/userProjects.js";
import { users } from "../../db/schema/users.js";
import { saveRecords } from "./baseDbService.js";
export async function getProjectUsersById(id, search) {
    const searchString = search?.trim();
    const result = await db.query.projects.findFirst({
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
                        where: and(isNull(users.deleted_at), eq(users.user_status, "ACTIVE"), searchString ? ilike(users.display_name, `%${searchString}%`) : undefined),
                        columns: {
                            id: true,
                            display_name: true,
                            user_status: true,
                        },
                    },
                },
            },
        },
    });
    const usersList = result?.userProjects
        ?.filter((userProject) => userProject.users !== null)
        ?.map((userProject) => ({
        id: userProject.users.id,
        display_name: userProject.users.display_name,
    })) ?? [];
    return usersList;
}
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
// Get project users for dropdown with improved filtering and null checks
export async function getProjectUsersByIdDropdown(id, search) {
    const result = await db.query.projects.findFirst({
        where: and(eq(projects.id, id), isNull(projects.deleted_at)),
        columns: {},
        with: {
            userProjects: {
                columns: {},
                where: and(eq(user_projects.project_id, id), isNull(user_projects.deleted_at)),
                with: {
                    users: {
                        where: and(isNull(users.deleted_at), eq(users.user_status, "ACTIVE")),
                        columns: {
                            id: true,
                            display_name: true,
                        },
                    },
                },
            },
        },
    });
    if (!result)
        return [];
    let usersList = result.userProjects?.map((userProject) => ({
        id: userProject.users.id,
        display_name: userProject.users.display_name,
    })) ?? [];
    if (search && search.trim()) {
        const searchTerm = search.trim().toLowerCase();
        usersList = usersList.filter((u) => u.display_name?.toLowerCase().includes(searchTerm));
    }
    return usersList;
}
export async function getNonExistingUsers(projectId, search) {
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
    const assignedIds = project?.userProjects?.map((up) => up.user_id).filter((id) => id !== null) || [];
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
