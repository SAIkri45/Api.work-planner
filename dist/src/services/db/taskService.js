import { and, desc, eq, ilike, isNull, sql } from "drizzle-orm";
import { TASK_NOT_FOUND } from "../../constants/appMessages.js";
import { db } from "../../db/configuration.js";
import { projects } from "../../db/schema/projects.js";
import { task_assignees } from "../../db/schema/taskAssignees.js";
import { Tasks } from "../../db/schema/tasks.js";
import { users } from "../../db/schema/users.js";
import BadRequestException from "../../exceptions/badRequestException.js";
import ConflictException from "../../exceptions/conflictException.js";
import NotFoundException from "../../exceptions/notFoundException.js";
import { buildOrderByClause } from "../../helpers/projectHelper.js";
import { buildTaskFilters } from "../../helpers/taskhelper.js";
import { getSingleRecordByMultipleColumnValues, saveRecords } from "./baseDbService.js";
import { getAllUsersInProject } from "./projectService.js";
export async function gatAllTaskList(offset, pageSize, search, orderBy, taskStatus, startDate, endDate) {
    const filters = buildTaskFilters(search, taskStatus, startDate, endDate);
    const orderByClause = buildOrderByClause(orderBy);
    const result = await db.query.Tasks.findMany({
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
    });
    const total_records = (await db
        .select({ count: sql `count(*)` })
        .from(Tasks)
        .where(and(...filters)))[0]?.count || 0;
    return { result, total_records };
}
// // active + soft-deleted
export async function getAllTaskAssignees(taskId) {
    const allAssignees = await db
        .select({ user_id: task_assignees.user_id })
        .from(task_assignees)
        .where(and(eq(task_assignees.task_id, taskId), isNull(task_assignees.deleted_at)));
    return [...new Set(allAssignees.map(record => record.user_id))];
}
// Core function to assign users to task
export async function assignUsersToTask(taskId, uniqueUserIds) {
    if (!uniqueUserIds.length)
        return [];
    // Get task and validate it exists
    const task = await getSingleRecordByMultipleColumnValues(Tasks, ["id", "deleted_at"], [taskId, null], ["id", "project_id", "task_title"]);
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
    return await saveRecords(task_assignees, assigneeRecords);
}
export async function usersByTaskIdDropdown(taskId, search) {
    const searchString = search?.trim().toLowerCase();
    const result = await db.query.Tasks.findFirst({
        where: and(eq(Tasks.id, taskId), isNull(Tasks.deleted_at)),
        columns: {},
        with: {
            assignees: {
                columns: {},
                where: and(eq(task_assignees.task_id, taskId), isNull(task_assignees.deleted_at)),
                with: {
                    user: {
                        where: and(isNull(users.deleted_at), searchString ? ilike(users.display_name, `%${searchString}%`) : undefined),
                        orderBy: desc(users.id),
                        columns: {
                            id: true,
                            display_name: true,
                        },
                    },
                },
            },
        },
    });
    const assignedUsers = result?.assignees
        ?.map((assignee) => assignee.user)
        .filter((user) => user !== null) || [];
    return assignedUsers;
}
