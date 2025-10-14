import { and, desc, eq, exists, gte, ilike, inArray, isNull, lte, not, sql } from "drizzle-orm";
import { allowedTaskStatus } from "../../constants/appMessages.js";
import { db } from "../../db/configuration.js";
import { projects } from "../../db/schema/projects.js";
import { task_assignees } from "../../db/schema/taskAssignees.js";
import { Tasks } from "../../db/schema/tasks.js";
import { user_projects } from "../../db/schema/userProjects.js";
import { users } from "../../db/schema/users.js";
import NotFoundException from "../../exceptions/notFoundException.js";
import { buildOrderByClause, buildProjectFilters } from "../../helpers/projectHelper.js";
import { getMultipleRecordsByMultipleColumnValues, saveRecords } from "./baseDbService.js";
export async function getProjectUsersById(id, search) {
    const searchString = search?.trim();
    const result = await db.query.projects.findFirst({
        where: and(eq(projects.id, id), isNull(projects.deleted_at)),
        columns: {},
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
                            user_type: true,
                            profile_pic: true,
                            designation: true,
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
        user_status: userProject.users.user_status,
        user_type: userProject.users.user_type,
        profile_pic: userProject.users.profile_pic,
        designation: userProject.users.designation,
    })) ?? [];
    return usersList;
}
export async function insertUsersToProject(projectId, userIds) {
    if (!userIds.length)
        return [];
    const userProjectRecords = userIds.map((userId) => ({ project_id: projectId, user_id: userId }));
    await saveRecords(user_projects, userProjectRecords);
    return userProjectRecords;
}
export async function checkedUsersInProject(projectId) {
    const existingUserProjects = await db
        .select({ user_ids: user_projects.user_id })
        .from(user_projects)
        .where(and(eq(user_projects.project_id, projectId), isNull(user_projects.deleted_at)));
    return [...new Set(existingUserProjects.map(record => record.user_ids))];
}
// New helper function to get ALL users in project (active + soft-deleted)
export async function getAllUsersInProject(projectId) {
    const allUserProjects = await db
        .select({ user_ids: user_projects.user_id })
        .from(user_projects)
        .where(eq(user_projects.project_id, projectId)); // No deleted_at filter
    return [...new Set(allUserProjects.map(record => record.user_ids))];
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
    const searchString = search?.trim();
    const result = await db.query.projects.findFirst({
        where: and(eq(projects.id, id), isNull(projects.deleted_at)),
        columns: {},
        with: {
            userProjects: {
                columns: {},
                where: and(eq(user_projects.project_id, id), isNull(user_projects.deleted_at)),
                with: {
                    users: {
                        where: and(isNull(users.deleted_at), eq(users.user_status, "ACTIVE"), searchString ? ilike(users.display_name, `%${searchString}%`) : undefined),
                        columns: {
                            id: true,
                            display_name: true,
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
export async function getNonExistingUsers(projectId, search) {
    const searchTerm = search?.trim();
    return await db
        .select({
        id: users.id,
        display_name: users.display_name,
    })
        .from(users)
        .where(and(isNull(users.deleted_at), eq(users.user_status, "ACTIVE"), not(exists(db
        .select()
        .from(user_projects)
        .where(and(eq(user_projects.user_id, users.id), eq(user_projects.project_id, projectId), isNull(user_projects.deleted_at))))), searchTerm ? ilike(users.display_name, `%${searchTerm}%`) : undefined));
}
export async function assignUsersToProject(projectId, userIds) {
    if (!userIds.length)
        return { assigned_users: [] };
    // Directly insert users into project
    const insertedRecords = await insertUsersToProject(projectId, userIds);
    return { assigned_users: insertedRecords };
}
export async function getTasksByProjectId(projectId, search, offset, pageSize, orderBy, taskStatus, dueDate) {
    const filters = [
        eq(Tasks.project_id, projectId),
        isNull(Tasks.deleted_at),
    ];
    if (search?.trim()) {
        filters.push(ilike(Tasks.task_title, `%${search.trim()}%`));
    }
    if (taskStatus && allowedTaskStatus.includes(taskStatus.toUpperCase())) {
        filters.push(eq(Tasks.task_status, taskStatus.toUpperCase()));
    }
    if (dueDate) {
        // Assuming dueDate is already in the correct format
        filters.push(eq(Tasks.end_date, dueDate));
    }
    let orderByClause;
    if (orderBy) {
        const [column, direction] = orderBy.split(":");
        const dir = direction?.toLowerCase() === "desc" ? "desc" : "asc";
        orderByClause = dir === "desc"
            ? sql `${sql.identifier(column)} DESC`
            : sql `${sql.identifier(column)} ASC`;
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
            start_date: true,
            created_at: true,
        },
    });
    const total_records = (await db
        .select({ count: sql `count(*)` })
        .from(Tasks)
        .where(and(...filters)))[0]?.count || 0;
    const tasks = result.map(task => ({
        id: task.id,
        task_title: task.task_title,
        task_status: task.task_status,
        end_date: task.end_date,
        start_date: task.start_date,
        created_at: task.created_at,
    }));
    return { result: tasks, total_records };
}
export async function getProjectTaskStatusCounts(projectId) {
    const result = await db
        .select({
        total_count: sql `CAST(COUNT(*) AS INTEGER)`,
        completed_count: sql `CAST(COUNT(*) FILTER (WHERE ${Tasks.task_status} = 'COMPLETED') AS INTEGER)`,
        inProgress_count: sql `CAST(COUNT(*) FILTER (WHERE ${Tasks.task_status} = 'IN_PROGRESS') AS INTEGER)`,
        new_count: sql `CAST(COUNT(*) FILTER (WHERE ${Tasks.task_status} = 'NEW') AS INTEGER)`,
        review_count: sql `CAST(COUNT(*) FILTER (WHERE ${Tasks.task_status} = 'REVIEW') AS INTEGER)`,
        overdue_count: sql `CAST(COUNT(*) FILTER (WHERE ${Tasks.task_status} = 'OVERDUE') AS INTEGER)`,
        done_count: sql `CAST(COUNT(*) FILTER (WHERE ${Tasks.task_status} = 'DONE') AS INTEGER)`,
    })
        .from(Tasks)
        .where(and(eq(Tasks.project_id, projectId), isNull(Tasks.deleted_at)))
        .groupBy(Tasks.project_id);
    return result[0];
}
export async function userCreatedProjectById(projectId) {
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
export async function getAllUsersInProjectWithPagination(offset, pageSize, search, orderBy, projectStatus, user) {
    const filters = await buildProjectFilters(search, projectStatus, user);
    const orderByClause = buildOrderByClause(orderBy);
    const result = await db.query.projects.findMany({
        where: and(...filters),
        orderBy: orderByClause,
        offset,
        limit: pageSize,
        columns: {
            id: true,
            title: true,
            start_date: true,
            due_date: true,
            logo_url: true,
            project_status: true,
        },
        with: {
            userProjects: {
                where: isNull(user_projects.deleted_at),
                with: {
                    users: {
                        where: and(isNull(users.deleted_at), eq(users.user_status, "ACTIVE")),
                        orderBy: desc(users.created_at),
                        columns: {
                            id: true,
                            display_name: true,
                        },
                    },
                },
            },
        },
    });
    const totalCountResult = await db
        .select({ count: sql `count(*)` })
        .from(projects)
        .where(and(...filters));
    const total_records = totalCountResult[0].count;
    const mappedResult = result.map((project) => ({
        id: project.id,
        project_name: project.title,
        logo_url: project.logo_url,
        project_status: project.project_status,
        project_start_date: project.start_date,
        project_end_date: project.due_date,
        users: project.userProjects
            .filter((userProject) => userProject.users)
            .map((userProject) => ({
            user_id: userProject.users.id,
            display_name: userProject.users.display_name,
        })),
    }));
    return {
        result: mappedResult,
        total_records,
    };
}
export async function checkTaskExist(projectId) {
    const incompleteTasks = await db.query.Tasks.findMany({
        where: and(eq(Tasks.project_id, projectId), isNull(Tasks.deleted_at), not(eq(Tasks.task_status, "COMPLETED"))),
    });
    return incompleteTasks;
}
export async function updateProjectStatus() {
    // Get previous date in UTC (not local timezone)
    const today = new Date();
    const previousDate = new Date(today.getTime() - 24 * 60 * 60 * 1000); // Go back 24 hours
    // Set to start of day in UTC
    const previousDateStart = new Date(`${previousDate.toISOString().split("T")[0]}T00:00:00.000Z`);
    // Set to end of day in UTC
    const previousDateEnd = new Date(`${previousDate.toISOString().split("T")[0]}T23:59:59.999Z`);
    const overdueProjectIds = await db
        .select({
        id: projects.id,
    })
        .from(projects)
        .where(and(eq(projects.project_status, "IN_PROGRESS"), gte(projects.due_date, previousDateStart), // due_date >= start of previous day UTC
    lte(projects.due_date, previousDateEnd), // due_date <= end of previous day UTC
    isNull(projects.deleted_at)));
    if (overdueProjectIds.length === 0) {
        throw new NotFoundException("No overdue projects found");
    }
    const projectIdsArray = overdueProjectIds.map(pIds => pIds.id);
    const updatedProjects = await db.update(projects)
        .set({
        project_status: "OVERDUE",
        updated_at: new Date(),
    })
        .where(and(inArray(projects.id, projectIdsArray), eq(projects.project_status, "IN_PROGRESS"), isNull(projects.deleted_at)))
        .returning({
        id: projects.id,
        project_name: projects.title,
        project_status: projects.project_status,
        due_date: projects.due_date,
    });
    return {
        updatedProjects,
    };
}
;
export async function getAllProjectsWithRoleBasedAccess(offset, pageSize, search, orderBy, projectStatus, user) {
    const filters = await buildProjectFilters(search, projectStatus, user);
    const orderByClause = buildOrderByClause(orderBy);
    const result = await db.query.projects.findMany({
        where: and(...filters),
        orderBy: orderByClause,
        offset,
        limit: pageSize,
        columns: {
            id: true,
            title: true,
            description: true,
            logo_url: true,
            project_status: true,
            start_date: true,
            due_date: true,
        },
    });
    const totalCountResult = await db
        .select({ count: sql `count(*)` })
        .from(projects)
        .where(and(...filters));
    const total_records = totalCountResult[0].count;
    return {
        result,
        total_records,
    };
}
export async function softDeleteTaskAssigneesByProjectId(projectId, trx) {
    if (!projectId) {
        return;
    }
    const client = trx ?? db;
    const tasks = await getMultipleRecordsByMultipleColumnValues(Tasks, ["project_id", "deleted_at"], [projectId, null], ["id"]);
    const taskIds = tasks.map(task => task.id);
    if (taskIds.length === 0) {
        return;
    }
    await client
        .update(task_assignees)
        .set({
        deleted_at: new Date(),
        updated_at: new Date(),
    })
        .where(and(inArray(task_assignees.task_id, taskIds), isNull(task_assignees.deleted_at)));
}
// export async function  createProjectWithAssignments(projectData: Partial<Project>,assignedUsers:number[],createdBy: number): Promise<{ project: Project; userProjects: UserProjects[] }> {
//     let insertedProject = {} as Project;
//     let insertedUserProjects: UserProjects[] = [];
//     await db.transaction(async (trx) => {
//       insertedProject = await saveSingleRecordWithTrx<Project>(projects,{ ...projectData, created_by: createdBy },trx);
//       if (assignedUsers?.length) {
//         const userProjectRecords = assignedUsers.map((userId) => ({user_id: userId,project_id: insertedProject.id,}));
//         insertedUserProjects = await saveRecordsWithTrx<UserProjects>(user_projects,userProjectRecords,trx);
//       }
//     });
//     return { insertedData:insertedProject, insertedDataUsers: insertedUserProjects };
//   }
