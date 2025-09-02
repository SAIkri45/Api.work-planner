import { eq, isNull } from "drizzle-orm";
import type { Context } from "hono";
import {
  TASK_ASSIGNEES_DELETED,
  TASK_CANNOT_DELETED,
  TASK_CREATED,
  TASK_ID_REQUIRED,
  TASK_NOT_FOUND,
  TASK_STATUS_NOT_COMPLETED,
  TASK_USERS_DELETED,
  TASK_VALIDATION_ERROR,
  TRANSACTION_ROLLBACK,
  USER_IDS_REQUIRED
} from "../constants/appMessages";
import { db } from "../db/configuration.js";
import { TaskAssignees, task_assignees } from "../db/schema/taskAssignees";
import { Tasks,Task} from "../db/schema/tasks.js";
import BadRequestException from "../exceptions/badRequestException";
import NotFoundException from "../exceptions/notFoundException";
import {
  getRecordsCount,
  getSingleRecordByMultipleColumnValues,
  getSingleRecordByMultipleColumnValueswithtrx,
  saveSingleRecord,
  updateRecordByColumnValuewithtrx,
  updateRecordById
} from "../services/db/baseDbService";

import { sendSuccessResp } from "../utils/respUtils";
import { ValidatedCreateTask } from "../validations/schemas/vTaskSchema";
import { validateRequest } from "../validations/validateRequest";


export class TaskAssigneesController {
  // Create Task (with transaction)
  createTask = async (c: Context) => {
  try {
    const requestBody = await c.req.json();

    const validatedReq = await validateRequest<ValidatedCreateTask>(
      "create-task",
      requestBody,
      TASK_VALIDATION_ERROR
    );

    const { user_ids, ...taskData } = validatedReq;

    const task = await db.transaction(async (trx) => {
      const task = await saveSingleRecord<Task>(
        Tasks,
        taskData,
        trx
      );

      if (user_ids && user_ids.length > 0) {
        for (const uid of user_ids) {
          const assignee =
            await getSingleRecordByMultipleColumnValueswithtrx<TaskAssignees>(
              task_assignees,
              ["task_id", "user_id"],
              [task.id, uid],
              trx
            );

          if (!assignee) {
            await saveSingleRecord<TaskAssignees>(
              task_assignees,
              {
                task_id: task.id,
                user_id: uid,
              },
              trx
            );
          }
        }
      }

      return task; 
    });

   
    return sendSuccessResp(c, 200, TASK_CREATED, task);
  } catch (err) {
    throw new BadRequestException(TRANSACTION_ROLLBACK);
  }
 };


  // //delete taskassignees
  // deleteTaskAssignees = async (c: Context) => {
  //   const id = Number(c.req.param("id"));
  //   const body = await c.req.json<{ user_ids?: number[] }>();
  //   const { user_ids } = body;

  //   if (!id) {
  //     throw new BadRequestException(TASK_ID_REQUIRED);
  //   }

  //   if (!user_ids || user_ids.length === 0) {
  //     throw new BadRequestException(USER_IDS_REQUIRED);
  //   }

  //   const now = new Date();

  //   const result = await db.transaction(async (tx) => {
  //     const deletedAssignees =
  //       await updateRecordByColumnValuewithtrx<TaskAssignees>(
  //         task_assignees,
  //         "task_id",
  //         id,
  //         { deleted_at: now },
  //         tx,
  //         {
  //           column: "user_id",
  //           operator: "IN",
  //           value: user_ids,
  //         }
  //       );

  //     if (!deletedAssignees || deletedAssignees.length === 0) {
  //       return tx.rollback();
  //     }

  //     return { task_id: id, deleted_assignees: deletedAssignees };
  //   });

  //   if (!result) {
  //     throw new BadRequestException(TASK_NOT_FOUND);
  //   }

  //   return sendSuccessResp(c, 200, TASK_ASSIGNEES_DELETED, result);
  // };

  // Delete Task
  deleteTask = async (c: Context) => {
    const id = Number(c.req.param("id"));

    if (!id) {
      throw new BadRequestException(TASK_ID_REQUIRED);
    }

    const task =
      (await getSingleRecordByMultipleColumnValues<Task>(
        Tasks,
        ["id", "deleted_at"],
        [id, null],
        ["id", "task_status"]
      )) || null;

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
    const deletedTask = await updateRecordById<Task>(Tasks, id, {
      deleted_at: now,
    });

    await updateRecordById<TaskAssignees>(task_assignees, id, {
      deleted_at: now,
    });

    return sendSuccessResp(c, 200, TASK_USERS_DELETED, {
      task_id: id,
      deleted_at: now,
      deleted_task: deletedTask,
    });
  };
}

export const TaskAssigneesControllerInstance = new TaskAssigneesController();
