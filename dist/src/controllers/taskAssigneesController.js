import { INVALID_INPUT, TASK_ALREADY_EXISTS, TASK_ASSIGNEES_FETCHED, TASK_CREATED, TASK_DELETED, TASK_FAILED_TO_FETCH, TASK_ID_REQUIRED, TASK_NOT_FOUND, TASK_STATUS_NOT_COMPLETED, TASK_USERS_DELETED, TASK_VALIDATION_ERROR, TASKS_FETCHED, USERS_ASSIGNED, } from "../constants/appMessages.js";
import { db } from "../db/configuration.js";
import { task_assignees } from "../db/schema/taskAssignees.js";
import { Tasks } from "../db/schema/tasks.js";
import BadRequestException from "../exceptions/badRequestException.js";
import ConflictException from "../exceptions/conflictException.js";
import NotFoundException from "../exceptions/notFoundException.js";
import { getMultipleRecordsByAColumnValue, getSingleRecordByMultipleColumnValues, saveRecordswithtrx, saveSingleRecord, updateRecordById, updateRecordByMultipleColumnValues, updateRecordByMultipleColumnValuesWithTrx, } from "../services/db/baseDbService.js";
import { assignUsersToTask, usersByTaskIdDropdown } from "../services/db/taskService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { validateRequest } from "../validations/validateRequest.js";
export class TaskAssigneesController {
    // Create Task (with transaction)
    createTask = async (c) => {
        try {
            const requestBody = await c.req.json();
            const userDetails = c.get("user_payload");
            const validatedReq = await validateRequest("create-task", requestBody, TASK_VALIDATION_ERROR);
            const { assigned_users, ...taskData } = validatedReq;
            // check duplicate task
            const taskExists = await getSingleRecordByMultipleColumnValues(Tasks, ["task_title", "deleted_at", "project_id"], [taskData.task_title, null, taskData.project_id], ["id"]);
            if (taskExists) {
                throw new ConflictException(TASK_ALREADY_EXISTS);
            }
            let task; // here add data type
            let insertedDataUsers;
            await db.transaction(async (trx) => {
                // create task
                task = await saveSingleRecord(Tasks, { ...taskData, created_by: userDetails.id }, trx);
                // task = await saveSingleRecord<Task>(Tasks, taskData, trx);
                // assign users if provided
                if (assigned_users?.length) {
                    const assigneeRecords = assigned_users.map(user_id => ({
                        task_id: task.id,
                        task_title: task.task_title,
                        created_by: task.created_by,
                        user_id,
                    }));
                    insertedDataUsers = await saveRecordswithtrx(task_assignees, assigneeRecords, trx);
                }
            });
            return sendSuccessResp(c, 200, TASK_CREATED, { ...task, insertedDataUsers });
        }
        catch (err) {
            throw err;
        }
    };
    // Delete Task
    deleteTask = async (c) => {
        const taskId = +c.req.param("id");
        if (!taskId) {
            throw new BadRequestException(INVALID_INPUT);
        }
        const task = await getSingleRecordByMultipleColumnValues(Tasks, ["id", "deleted_at"], [taskId, null], ["id"]);
        if (!task) {
            throw new NotFoundException(TASK_NOT_FOUND);
        }
        const checkTaskStatus = await getSingleRecordByMultipleColumnValues(Tasks, ["id", "deleted_at", "task_status"], [taskId, null, "COMPLETED"], ["id"]);
        if (!checkTaskStatus) {
            throw new BadRequestException(TASK_STATUS_NOT_COMPLETED);
        }
        await db.transaction(async (trx) => {
            updateRecordById(Tasks, taskId, { deleted_at: new Date() }, trx);
            updateRecordByMultipleColumnValuesWithTrx(task_assignees, ["task_id"], [taskId], { deleted_at: new Date() }, trx);
        });
        return sendSuccessResp(c, 200, TASK_DELETED);
    };
    // Remove Assignees by Task ID
    removeAssigneesByTaskId = async (c) => {
        const taskId = +c.req.param("id");
        const { user_ids } = await c.req.json();
        const taskExist = await getSingleRecordByMultipleColumnValues(Tasks, ["id", "deleted_at"], [taskId, null], ["id"]);
        if (!taskExist) {
            throw new NotFoundException(TASK_NOT_FOUND);
        }
        await updateRecordByMultipleColumnValues(task_assignees, ["task_id", "user_id"], [taskId, user_ids], { deleted_at: new Date() });
        return sendSuccessResp(c, 200, TASK_USERS_DELETED);
    };
    getAssigneesByTaskId = async (c) => {
        const taskId = +c.req.param("id");
        const searchString = c.req.query("search_string");
        if (!taskId) {
            throw new BadRequestException(TASK_ID_REQUIRED);
        }
        const taskExist = await getSingleRecordByMultipleColumnValues(Tasks, ["id", "deleted_at"], [taskId, null], ["id"]);
        if (!taskExist) {
            throw new NotFoundException(TASK_NOT_FOUND);
        }
        const result = await usersByTaskIdDropdown(taskId, searchString);
        return sendSuccessResp(c, 200, TASK_ASSIGNEES_FETCHED, result);
    };
    // assign users to already exist task
    // addUsersToTask = async (c: Context) => {
    //   try {
    //     const taskId = +c.req.param("id");
    //     const requestBody = await c.req.json();
    //     const { user_ids } = requestBody;
    //     if (!taskId || !user_ids?.length) {
    //       throw new BadRequestException(TASKID_USERID_REQUIRED);
    //     }
    //     const task = await getSingleRecordByMultipleColumnValues<Task>(Tasks, ["id", "deleted_at"], [taskId, null]);
    //     if (!task) {
    //       throw new NotFoundException(TASK_NOT_FOUND);
    //     }
    //     const existingAssignees = await getMultipleRecordsByAColumnValue<TaskAssignees>(task_assignees, "task_id", taskId);
    //     const existingUserIds = new Set(
    //       existingAssignees.map((a: TaskAssignees) => a.user_id),
    //     );
    //     const newUserIds = user_ids.filter(
    //       (id: number) => !existingUserIds.has(id),
    //     );
    //     const assigneeRecords = newUserIds.map((user_id: number) => ({
    //       task_id: taskId, user_id
    //     }));
    //     await db.transaction(async (trx) => {
    //       await saveRecordswithtrx<TaskAssignees>(task_assignees, assigneeRecords, trx)
    //     });
    //     return sendSuccessResp(c, 200, USER_ADDED, { task_id: taskId, added_user_ids: newUserIds });
    //   }
    //   catch (err) {
    //     throw new BadRequestException(USER_NOT_ADDED);
    //   }
    // };
    // Controller function
    assignUsersToTask = async (c) => {
        const taskId = +c.req.param("id");
        const requestBody = await c.req.json();
        if (!taskId) {
            throw new BadRequestException(INVALID_INPUT);
        }
        const validatedReq = await validateRequest("add-users-to-task", requestBody, TASK_VALIDATION_ERROR);
        const taskExist = await getSingleRecordByMultipleColumnValues(Tasks, ["id", "deleted_at"], [taskId, null], ["id"]);
        if (!taskExist) {
            throw new NotFoundException(TASK_NOT_FOUND);
        }
        const { user_ids } = validatedReq;
        const uniqueUserIds = [...new Set(user_ids)];
        const result = await assignUsersToTask(taskId, uniqueUserIds);
        return sendSuccessResp(c, 200, USERS_ASSIGNED, result);
    };
    // gettasks by project id
    getTasksByProjectId = async (c) => {
        try {
            const projectId = +c.req.param("id");
            if (!projectId) {
                throw new BadRequestException(INVALID_INPUT);
            }
            const tasks = await getMultipleRecordsByAColumnValue(Tasks, "project_id", projectId);
            if (!tasks.length) {
                return sendSuccessResp(c, 200, TASK_NOT_FOUND, {
                    project_id: projectId,
                    tasks: [],
                });
            }
            return sendSuccessResp(c, 200, TASKS_FETCHED, {
                project_id: projectId,
                tasks,
            });
        }
        catch (err) {
            throw new BadRequestException(TASK_FAILED_TO_FETCH);
        }
    };
}
export const TaskAssigneesControllerInstance = new TaskAssigneesController();
