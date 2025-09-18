import type { Context } from "hono";

import type { TaskAssignees } from "../db/schema/taskAssignees.js";
import type { Task } from "../db/schema/tasks.js";
import type { ValidatedAssignUsersToTask, ValidatedRemoveUsersFromTask } from "../validations/schemas/vTaskAssigneesSchema.js";
import type { ValidatedCreateTask } from "../validations/schemas/vTaskSchema.js";

import {
  INVALID_INPUT,
  TASK_ALREADY_EXISTS,
  TASK_ASSIGNEES_FETCHED,
  TASK_CREATED,
  TASK_DELETED,
  TASK_ID_REQUIRED,
  TASK_NOT_FOUND,
  TASK_STATUS_NOT_COMPLETED,
  TASK_USERS_DELETED,
  TASK_VALIDATION_ERROR,
  USERS_ASSIGNED,
  USERS_FETCHED,
} from "../constants/appMessages.js";
import { db } from "../db/configuration.js";
import { task_assignees } from "../db/schema/taskAssignees.js";
import { Tasks } from "../db/schema/tasks.js";
import BadRequestException from "../exceptions/badRequestException.js";
import ConflictException from "../exceptions/conflictException.js";
import NotFoundException from "../exceptions/notFoundException.js";
import {
  getSingleRecordByMultipleColumnValues,
  saveRecordswithtrx,
  saveSingleRecord,
  updateRecordById,
  updateRecordByMultipleColumnValues,
  updateRecordByMultipleColumnValuesWithTrx,
} from "../services/db/baseDbService.js";
import { assignUsersToTask, getUnassignedUsersForTask, usersByTaskIdDropdown } from "../services/db/taskService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { validateRequest } from "../validations/validateRequest.js";

export class TaskAssigneesController {
  // Create Task (with transaction)
  createTask = async (c: Context) => {
    try {
      const requestBody = await c.req.json();
      const userDetails = c.get("user_payload");

      const validatedReq = await validateRequest<ValidatedCreateTask>("create-task", requestBody, TASK_VALIDATION_ERROR);

      const { assigned_users, ...taskData } = validatedReq;

      // check duplicate task
      const taskExists = await getSingleRecordByMultipleColumnValues<Task>(Tasks, ["task_title", "deleted_at", "project_id"], [taskData.task_title, null, taskData.project_id], ["id"]);

      if (taskExists) {
        throw new ConflictException(TASK_ALREADY_EXISTS);
      }

      let task: any;// here add data type
      let insertedDataUsers: any;
      await db.transaction(async (trx) => {
        // create task
        task = await saveSingleRecord<Task>(Tasks, { ...taskData, created_by: userDetails.id }, trx);
        // task = await saveSingleRecord<Task>(Tasks, taskData, trx);
        // assign users if provided
        if (assigned_users?.length) {
          const assigneeRecords = assigned_users.map(user_id => ({
            task_id: task.id,
            task_title: task.task_title,
            created_by: task.created_by,
            user_id,
          }));

          insertedDataUsers = await saveRecordswithtrx<TaskAssignees>(task_assignees, assigneeRecords, trx);
        }
      });

      return sendSuccessResp(c, 200, TASK_CREATED, { ...task, insertedDataUsers });
    }
    catch (err) {
      throw err;
    }
  };

  // Delete Task
  deleteTask = async (c: Context) => {
    const taskId = +c.req.param("id");

    if (!taskId) {
      throw new BadRequestException(INVALID_INPUT);
    }

    const task = await getSingleRecordByMultipleColumnValues<Task>(Tasks, ["id", "deleted_at"], [taskId, null], ["id"]);

    if (!task) {
      throw new NotFoundException(TASK_NOT_FOUND);
    }

    const checkTaskStatus = await getSingleRecordByMultipleColumnValues<Task>(Tasks, ["id", "deleted_at", "task_status"], [taskId, null, "COMPLETED"], ["id"]);

    if (!checkTaskStatus) {
      throw new ConflictException(TASK_STATUS_NOT_COMPLETED);
    }

    await db.transaction(async (trx) => {
      updateRecordById<Task>(Tasks, taskId, { deleted_at: new Date() }, trx);

      updateRecordByMultipleColumnValuesWithTrx<TaskAssignees>(task_assignees, ["task_id"], [taskId], { deleted_at: new Date() }, trx);
    });

    return sendSuccessResp(c, 200, TASK_DELETED);
  };

  // Remove Assignees by Task ID
  removeAssigneesByTaskId = async (c: Context) => {
    const taskId = +c.req.param("id");
    const reqBody = await c.req.json();

    const validatedReq = await validateRequest<ValidatedRemoveUsersFromTask>("remove-users-from-task", reqBody, TASK_VALIDATION_ERROR);

    const taskExist = await getSingleRecordByMultipleColumnValues<Task>(Tasks, ["id", "deleted_at"], [taskId, null], ["id"]);

    if (!taskExist) {
      throw new NotFoundException(TASK_NOT_FOUND);
    }

    await updateRecordByMultipleColumnValues<TaskAssignees>(task_assignees, ["task_id", "user_id"], [taskId, validatedReq.user_ids], { deleted_at: new Date() });

    return sendSuccessResp(c, 200, TASK_USERS_DELETED);
  };

  getAssigneesByTaskId = async (c: Context) => {
    const taskId = +c.req.param("id");
    const searchString = c.req.query("search_string");

    if (!taskId) {
      throw new BadRequestException(TASK_ID_REQUIRED);
    }

    const taskExist = await getSingleRecordByMultipleColumnValues<Task>(Tasks, ["id", "deleted_at"], [taskId, null], ["id"]);

    if (!taskExist) {
      throw new NotFoundException(TASK_NOT_FOUND);
    }

    const result = await usersByTaskIdDropdown(taskId, searchString);

    return sendSuccessResp(c, 200, TASK_ASSIGNEES_FETCHED, result);
  };

  assignUsersToTask = async (c: Context) => {
    const taskId = +c.req.param("id");
    const requestBody = await c.req.json();

    if (!taskId) {
      throw new BadRequestException(INVALID_INPUT);
    }

    const validatedReq = await validateRequest<ValidatedAssignUsersToTask>("add-users-to-task", requestBody, TASK_VALIDATION_ERROR);

    const taskExist = await getSingleRecordByMultipleColumnValues<Task>(Tasks, ["id", "deleted_at"], [taskId, null], ["id"]);

    if (!taskExist) {
      throw new NotFoundException(TASK_NOT_FOUND);
    }

    const { user_ids } = validatedReq;

    const uniqueUserIds = [...new Set(user_ids)];

    const result = await assignUsersToTask(taskId, uniqueUserIds);

    return sendSuccessResp(c, 200, USERS_ASSIGNED, result);
  };

  getUnassignedUsersDropdown = async (c: Context) => {
    const taskId = +c.req.param("id");
    const searchString = c.req.query("search_string");

    if (!taskId) {
      throw new BadRequestException(TASK_ID_REQUIRED);
    }

    const taskExist = await getSingleRecordByMultipleColumnValues<Task>(Tasks, ["id", "deleted_at"], [taskId, null], ["id"]);

    if (!taskExist) {
      throw new NotFoundException(TASK_NOT_FOUND);
    }

    const result = await getUnassignedUsersForTask(taskId, searchString);

    return sendSuccessResp(c, 200, USERS_FETCHED, result);
  };
}

export const TaskAssigneesControllerInstance = new TaskAssigneesController();
