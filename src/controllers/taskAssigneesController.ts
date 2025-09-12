import type { Context } from "hono";

import { eq, isNull } from "drizzle-orm";

import type { TaskAssignees } from "../db/schema/taskAssignees";
import type { Task } from "../db/schema/tasks.js";
import type { ValidatedCreateTask } from "../validations/schemas/vTaskSchema";

import {
  FAILED_TO_FETCH_USERS,
  NO_NEW_ASSIGNEES,
  PROJECT_ID_REQUIRED,
  TASK_ALREADY_EXISTS,
  TASK_ASSIGNEES_FETCHED,
  TASK_CANNOT_DELETED,
  TASK_CREATED,
  TASK_FAILED_TO_FETCH,
  TASK_ID_REQUIRED,
  TASK_NOT_FOUND,
  TASK_STATUS_NOT_COMPLETED,
  TASK_USERS_DELETED,
  TASK_VALIDATION_ERROR,
  TASKID_USERID_REQUIRED,
  TASKS_FETCHED,
  USER_ADDED,
  USER_NOT_ADDED,
} from "../constants/appMessages.js";
import { db } from "../db/configuration.js";
import { task_assignees } from "../db/schema/taskAssignees.js";
import { Tasks } from "../db/schema/tasks.js";
import BadRequestException from "../exceptions/badRequestException.js";
import ConflictException from "../exceptions/conflictException.js";
import NotFoundException from "../exceptions/notFoundException.js";
import {
  getMultipleRecordsByAColumnValue,
  getRecordsConditionally,
  getRecordsCount,
  getSingleRecordByMultipleColumnValues,
  saveRecordswithtrx,
  saveSingleRecord,
  updateRecordById,
  updateRecordByMultipleColumnValues,
} from "../services/db/baseDbService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { validateRequest } from "../validations/validateRequest.js";

export class TaskAssigneesController {
  // Create Task (with transaction)
  createTask = async (c: Context) => {
    try {
      const requestBody = await c.req.json();
      const userDetails = c.get("userDetails");

      const validatedReq = await validateRequest<ValidatedCreateTask>(
        "create-task",
        requestBody,
        TASK_VALIDATION_ERROR,
      );

      const { user_ids, ...taskData } = validatedReq;

      // check duplicate task
      const taskExists = await getSingleRecordByMultipleColumnValues<Task>(
        Tasks,
        ["task_title", "deleted_at", "project_id"],
        [taskData.task_title, null, taskData.project_id],
      );

      if (taskExists) {
        throw new ConflictException(TASK_ALREADY_EXISTS);
      }

      let task: any;// here add data type
      await db.transaction(async (trx) => {
        // create task
        task = await saveSingleRecord<Task>(Tasks, { ...taskData }, trx);

        // assign users if provided
        if (user_ids?.length) {
          const assigneeRecords = user_ids.map(user_id => ({
            task_id: task.id,
            user_id,
          }));

          await saveRecordswithtrx<TaskAssignees>(
            task_assignees,
            assigneeRecords,
            trx,
          );
        }
      });
      return sendSuccessResp(c, 200, TASK_CREATED, task);
    }
    catch (err) {
      throw err;
    }
  };

  // Delete Task
  deleteTask = async (c: Context) => {
    const id = Number(c.req.param("id"));

    const task
      = (await getSingleRecordByMultipleColumnValues<Task>(
        Tasks,
        ["id", "deleted_at"],
        [id, null],
        ["id", "task_status"],
      ));

    if (!task) {
      throw new NotFoundException(TASK_NOT_FOUND);
    }

    if (task.task_status !== "COMPLETED") {
      throw new BadRequestException(TASK_STATUS_NOT_COMPLETED);
    }

    const activeAssigneesCount = await getRecordsCount(task_assignees, [
      eq(task_assignees.task_id, id),
      isNull(task_assignees.deleted_at),
    ]);

    if (activeAssigneesCount !== 0) {
      throw new BadRequestException(TASK_CANNOT_DELETED);
    }

    const now = new Date();
    let deletedTask;
    await db.transaction(async (trx) => {
      deletedTask = updateRecordById<Task>(Tasks, id, { deleted_at: now }, trx);

      updateRecordById<TaskAssignees>(task_assignees, id, { deleted_at: now }, trx);
    });

    return sendSuccessResp(c, 200, TASK_USERS_DELETED, {
      task_id: id,
      deleted_at: now,
      deleted_task: deletedTask,
    });
  };

  // Remove Assignees by Task ID
  removeAssigneesByTaskId = async (c: Context) => {
    const taskId = +c.req.param("id");
    const { user_ids } = await c.req.json();

    const taskExist = await getSingleRecordByMultipleColumnValues<Task>(
      Tasks,
      ["id", "deleted_at"],
      [taskId, null],
      ["id"],
    );

    if (!taskExist) {
      throw new NotFoundException(TASK_NOT_FOUND);
    }

    await updateRecordByMultipleColumnValues<TaskAssignees>(
      task_assignees,
      ["task_id", "user_id"],
      [taskId, user_ids],
      { deleted_at: new Date() },
    );

    return sendSuccessResp(c, 200, TASK_USERS_DELETED);
  };

  // get assignees list by taskid
  getAssigneesByTaskId = async (c: Context) => {
    try {
      const taskId = +c.req.param("id");

      if (!taskId) {
        throw new BadRequestException(TASK_ID_REQUIRED);
      }

      const assignees = await getRecordsConditionally<TaskAssignees>(
        task_assignees,
        {
          columns: ["task_id", "deleted_at"],
          values: [taskId, null],
        },
        ["task_id", "user_id"],
        { columns: ["user_id"], values: ["asc"] },
      );

      return sendSuccessResp(c, 200, TASK_ASSIGNEES_FETCHED, assignees);
    }
    catch (err) {
      throw new BadRequestException(FAILED_TO_FETCH_USERS);
    }
  };

  // assign users to already exist task
  addUsersToTask = async (c: Context) => {
    try {
      const taskId = +c.req.param("id");

      const requestBody = await c.req.json();
      const { user_ids } = requestBody;

      if (!taskId || !user_ids?.length) {
        throw new BadRequestException(TASKID_USERID_REQUIRED);
      }

      const task = await getSingleRecordByMultipleColumnValues<Task>(
        Tasks,
        ["id", "deleted_at"],
        [taskId, null],
      );

      if (!task) {
        throw new NotFoundException(TASK_NOT_FOUND);
      }

      const existingAssignees
        = await getMultipleRecordsByAColumnValue<TaskAssignees>(
          task_assignees,
          "task_id",
          taskId,
        );

      const existingUserIds = new Set(
        existingAssignees.map((a: TaskAssignees) => a.user_id),
      );

      const newUserIds = user_ids.filter(
        (id: number) => !existingUserIds.has(id),
      );

      if (!newUserIds.length) {
        return sendSuccessResp(c, 200, NO_NEW_ASSIGNEES, {
          task_id: taskId,
          user_ids,
        });
      }

      const assigneeRecords = newUserIds.map((user_id: number) => ({
        task_id: taskId,
        user_id,
      }));

      await db.transaction(async (trx) => {
        await saveRecordswithtrx<TaskAssignees>(
          task_assignees,
          assigneeRecords,
          trx,
        );
      });

      return sendSuccessResp(c, 200, USER_ADDED, {
        task_id: taskId,
        added_user_ids: newUserIds,
      });
    }
    catch (err) {
      throw new BadRequestException(USER_NOT_ADDED);
    }
  };

  // gettasks by project id

  getTasksByProjectId = async (c: Context) => {
    try {
      const projectId = +c.req.param("id");

      if (!projectId) {
        throw new BadRequestException(PROJECT_ID_REQUIRED);
      }

      const tasks = await getMultipleRecordsByAColumnValue<Task>(
        Tasks,
        "project_id",
        projectId,
      );

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

  // get assignees by task id
  getTaskAssignees = async (c: Context) => {
    const taskId = +c.req.param("id");

    if (!taskId) {
      throw new BadRequestException(TASK_ID_REQUIRED);
    }

    //  Check task exists
    const task = await getSingleRecordByMultipleColumnValues<Task>(
      Tasks,
      ["id", "deleted_at"],
      [taskId, null],
    );

    if (!task) {
      throw new NotFoundException(TASK_NOT_FOUND);
    }

    //  Fetch assignees for this task
    const assignees = await getMultipleRecordsByAColumnValue<TaskAssignees>(
      task_assignees,
      "task_id",
      taskId,
    );

    if (!assignees.length) {
      return sendSuccessResp(c, 200, "No users assigned to this task", {
        task_id: taskId,
        users: [],
      });
    }

    return sendSuccessResp(c, 200, "Task assignees fetched successfully", {
      task_id: taskId,
      users: assignees.map((a: TaskAssignees) => a.user_id),
    });
  };
}

export const TaskAssigneesControllerInstance = new TaskAssigneesController();
