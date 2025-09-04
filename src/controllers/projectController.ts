import type { Context } from "hono";

import type { Project } from "../db/schema/projects.js";
import type { Task } from "../db/schema/tasks.js";
import type { UserProjects } from "../db/schema/userProjects.js";
import type { ProjectTasksResp, ProjectUsersResponse } from "../types/appTypes.js";
import type { DBTableColumns, OrderByQueryData, SortDirection, WhereQueryData } from "../types/dbTypes.js";
import type { ValidatedAddUsersToProject, ValidatedCreateProject, ValidatedRemoveUsersFromProject, ValidatedUpdateProject } from "../validations/schemas/vProjectSchema.js";

import { INVALID_INPUT, PROJECT_ALREADY_EXISTS, PROJECT_CREATED, PROJECT_DELETED, PROJECT_NOT_FOUND, PROJECT_NOT_FOUND_ID, PROJECT_STATUS, PROJECT_TASKS_IN_COMPLETED, PROJECT_UPDATED, PROJECT_USERS_ASSIGNED, PROJECT_USERS_REMOVED, PROJECT_USERS_VALIDATION_ERROR, PROJECT_VALIDATION_ERROR, PROJECTS_FETCHED, USER_FETCHED } from "../constants/appMessages.js";
import { db } from "../db/configuration.js";
import { projects } from "../db/schema/projects.js";
import { Tasks } from "../db/schema/tasks.js";
import { user_projects } from "../db/schema/userProjects.js";
import BadRequestException from "../exceptions/badRequestException.js";
import ConflictException from "../exceptions/conflictException.js";
import NotFoundException from "../exceptions/notFoundException.js";
import { getPaginationData } from "../helpers/paginationHelper.js";
import { parseOrderByQuery } from "../helpers/parseOrderByHelper.js";
import { getPaginatedRecordsConditionally, getRecordsConditionally, getSingleRecordByMultipleColumnValues, saveRecordsWithTrx, saveSingleRecord, saveSingleRecordWithTrx, softDeleteRecordByIdWithTrx, updateRecordById, updateRecordByMultipleColumnValuesWithTrx } from "../services/db/baseDbService.js";
import { assignUsersToProject, checkTaskExist, getAllUsersInProjectWithPagination, getNonExistingUsers, getProjectTaskStatusCounts, getProjectUsersById, getProjectUsersByIdDropdown, getTasksByProjectId, removeUsersFromProject, userCreatedProjectById } from "../services/db/projectService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { validateRequest } from "../validations/validateRequest.js";

class ProjectController {
  createProject = async (c: Context) => {
    const requestBody = await c.req.json();
    // const userDetails = c.get("userDetails");

    const validatedReq = await validateRequest<ValidatedCreateProject>("create-project", requestBody, PROJECT_VALIDATION_ERROR);

    const { user_ids, ...projectData } = validatedReq;

    const columnsToSelect = ["id", "title", "deleted_at", "created_by"] as const;

    const projectExists = await getSingleRecordByMultipleColumnValues<Project>(projects, ["title", "deleted_at"], [validatedReq.title, null], columnsToSelect);

    if (projectExists) {
      throw new ConflictException(PROJECT_ALREADY_EXISTS);
    }

    if (user_ids?.length) {
      const result = await db.transaction(async (trx) => {
        const insertedData = await saveSingleRecordWithTrx<Project>(projects, projectData, trx);

        const userProjectRecords = user_ids.map(user_id => ({
          user_id,
          project_id: insertedData.id,
        }));

        await saveRecordsWithTrx<UserProjects>(user_projects, userProjectRecords, trx);

        return insertedData;
      });

      return sendSuccessResp(c, 201, PROJECT_CREATED, result);
    }

    const insertedData = await saveSingleRecord<Project>(projects, projectData);
    return sendSuccessResp(c, 201, PROJECT_CREATED, insertedData);
  };

  getAllProjectsPaginated = async (c: Context) => {
    const page = +c.req.query("page")! || 1;
    const pageSize = +c.req.query("page_size")! || 10;
    const searchString = c.req.query("search_string") || null;
    const orderBy = c.req.query("order_by");
    const projectStatus = c.req.query("project_status")?.toLocaleUpperCase() || null;
    const dueDate = c.req.query("due_date");
    let orderByQueryData: OrderByQueryData<Project> = {
      columns: ["created_at"],
      values: ["desc"],
    };

    const WhereQueryData: WhereQueryData<Project> = {
      columns: ["deleted_at"],
      values: ["null"],
    };

    if (orderBy) {
      const orderByColumns: DBTableColumns<Project>[] = [];
      const orderByValues: SortDirection[] = [];
      const queryStrings = orderBy.split(",");
      for (const queryString of queryStrings) {
        const [column, value] = queryString.split(":");
        orderByColumns.push(column as DBTableColumns<Project>);
        orderByValues.push(value as SortDirection);
      }
      orderByQueryData = {
        columns: orderByColumns,
        values: orderByValues,
      };
    }

    if (searchString) {
      // Add search string filter using LIKE
      WhereQueryData.columns.push("title");
      WhereQueryData.values.push(`%${searchString}%`);
    }

    if (projectStatus) {
      WhereQueryData.columns.push("project_status");
      WhereQueryData.values.push(projectStatus);
    }

    if (dueDate) {
      WhereQueryData.columns.push("due_date");
      WhereQueryData.values.push(dueDate);
    }

    const columnsToSelect = ["id", "title", "description", "logo_url", "project_status", "start_date", "due_date"] as const;

    const result = await getPaginatedRecordsConditionally<Project>(projects, page, pageSize, orderByQueryData, WhereQueryData, columnsToSelect);

    return sendSuccessResp(c, 200, PROJECTS_FETCHED, result);
  };

  softDeleteProjectById = async (c: Context) => {
    const projectId = +c.req.param("id");

    if (!projectId) {
      throw new BadRequestException(INVALID_INPUT);
    }

    const projectExists = await getSingleRecordByMultipleColumnValues<Project>(projects, ["id", "deleted_at"], [projectId, null], ["id"]);

    if (!projectExists) {
      throw new NotFoundException(PROJECT_NOT_FOUND_ID);
    }

    const incompleteTasks = await checkTaskExist(projectId);

    if (incompleteTasks.length > 0) {
      throw new ConflictException(PROJECT_TASKS_IN_COMPLETED);
    }

    const projectStatus = await getSingleRecordByMultipleColumnValues<Project>(projects, ["id", "deleted_at", "project_status"], [projectId, null, "COMPLETED"], ["id", "project_status"]);

    if (!projectStatus) {
      throw new ConflictException(PROJECT_STATUS);
    }

    await db.transaction(async (trx) => {
      await softDeleteRecordByIdWithTrx<Project>(projects, projectId, { deleted_at: new Date() }, trx);

      await updateRecordByMultipleColumnValuesWithTrx<UserProjects>(user_projects, ["project_id"], [projectId], { deleted_at: new Date() }, trx);

      await updateRecordByMultipleColumnValuesWithTrx<Task>(Tasks, ["project_id"], [projectId], { deleted_at: new Date() }, trx);
    });

    return sendSuccessResp(c, 200, PROJECT_DELETED);
  };

  getAllProjectsDropDown = async (c: Context) => {
    const searchString = c.req.query("search_string");

    const orderByQueryData = parseOrderByQuery<Project>("id", "asc");

    const whereQueryData: WhereQueryData<Project> = {
      columns: ["deleted_at"],
      values: [null],
    };

    const columnsToSelect = ["id", "title"] as const;

    if (searchString) {
      // Add search string filter using LIKE
      whereQueryData.columns.push("title");
      whereQueryData.values.push(`%${searchString}%`);
    }

    const result = await getRecordsConditionally<Project>(projects, whereQueryData, columnsToSelect, orderByQueryData);

    return sendSuccessResp(c, 200, PROJECTS_FETCHED, result);
  };

  getProjectUsersById = async (c: Context) => {
    const projectId = +c.req.param("id");
    const searchString = c.req.query("search_string");

    if (!projectId) {
      throw new BadRequestException(INVALID_INPUT);
    }

    const projectExists = await getSingleRecordByMultipleColumnValues<Project>(projects, ["id", "deleted_at"], [projectId, null], ["id"]);

    if (!projectExists) {
      throw new NotFoundException(PROJECT_NOT_FOUND_ID);
    }

    const result = await getProjectUsersById(projectId, searchString);

    return sendSuccessResp(c, 200, USER_FETCHED, result);
  };

  updateProject = async (c: Context) => {
    const reqData = await c.req.json();
    const userDetails = c.get("userDetails");

    const projectId = +(c.req.param("id"));

    if (!projectId) {
      throw new BadRequestException(INVALID_INPUT);
    }

    const validatedReq = await validateRequest<ValidatedUpdateProject>("update-project", reqData, PROJECT_VALIDATION_ERROR);

    const projectExists = await getSingleRecordByMultipleColumnValues<Project>(projects, ["id", "deleted_at"], [projectId, null], ["id"]);

    if (!projectExists) {
      throw new NotFoundException(PROJECT_NOT_FOUND);
    }

    const result = await updateRecordById<Project>(projects, projectId, { ...validatedReq, updated_by: userDetails.id });

    return sendSuccessResp(c, 200, PROJECT_UPDATED, result);
  };

  assignUsersToProject = async (c: Context) => {
    const projectId = +c.req.param("id");

    const requestBody = await c.req.json();

    if (!projectId) {
      throw new BadRequestException(INVALID_INPUT);
    }

    const validatedReq = await validateRequest<ValidatedAddUsersToProject>("add-users-to-project", { ...requestBody, project_id: projectId }, PROJECT_USERS_VALIDATION_ERROR);

    const { user_ids } = validatedReq;
    const uniqueUserIds = [...new Set(user_ids)];

    const result = await assignUsersToProject(projectId, uniqueUserIds);

    return sendSuccessResp(c, 200, PROJECT_USERS_ASSIGNED, result);
  };

  removeUserFromProject = async (c: Context) => {
    const projectId = +c.req.param("id");
    const reqBody = await c.req.json();
    const validatedReq = await validateRequest<ValidatedRemoveUsersFromProject>("remove-users-from-project", reqBody, PROJECT_USERS_VALIDATION_ERROR);

    if (!projectId) {
      throw new BadRequestException(INVALID_INPUT);
    }

    const uniqueUserIds = [...new Set(validatedReq.user_ids)];

    await removeUsersFromProject(projectId, uniqueUserIds);

    return sendSuccessResp(c, 200, PROJECT_USERS_REMOVED);
  };

  getProjectBasedAssignedUsers = async (c: Context) => {
    const projectId = +c.req.param("id");
    const searchString = c.req.query("search_string");

    if (!projectId) {
      throw new BadRequestException(INVALID_INPUT);
    }

    const existedProject = await getSingleRecordByMultipleColumnValues<Project>(projects, ["id", "deleted_at"], [projectId, null], ["id"]);

    if (!existedProject) {
      throw new NotFoundException(PROJECT_NOT_FOUND);
    }

    const result = await getProjectUsersByIdDropdown(projectId, searchString);

    return sendSuccessResp(c, 200, USER_FETCHED, result);
  };

  getAllNonExistingUsers = async (c: Context) => {
    const projectId = +c.req.param("id");
    const searchString = c.req.query("search_string");

    if (!projectId) {
      throw new BadRequestException(INVALID_INPUT);
    }

    const projectExists = await getSingleRecordByMultipleColumnValues<Project>(projects, ["id", "deleted_at"], [projectId, null], ["id"]);

    if (!projectExists) {
      throw new NotFoundException(PROJECT_NOT_FOUND);
    }

    const result = await getNonExistingUsers(projectId, searchString);
    return sendSuccessResp(c, 200, "Non-existing users fetched successfully", result);
  };

  getAllTasksByProjectId = async (c: Context) => {
    const projectId = +c.req.param("id");
    const page = +(c.req.query("page") || 1);
    const pageSize = +(c.req.query("page_size") || 10);
    const offset = (page - 1) * pageSize;
    const search = c.req.query("search_string");
    const orderBy = c.req.query("order_by");
    const taskStatus = c.req.query("task_status");
    const dueDate = c.req.query("due_date");

    if (!projectId) {
      throw new BadRequestException(INVALID_INPUT);
    }

    const projectExists = await getSingleRecordByMultipleColumnValues<Project>(
      projects,
      ["id", "deleted_at"],
      [projectId, null],
      ["id"],
    );

    if (!projectExists) {
      throw new NotFoundException(PROJECT_NOT_FOUND);
    }

    const { result, total_records } = await getTasksByProjectId(
      projectId,
      search,
      offset,
      pageSize,
      orderBy,
      taskStatus,
      dueDate,
    );

    const paginationInfo = getPaginationData(page, pageSize, total_records);

    const finalResponse: ProjectTasksResp = {
      pagination_info: paginationInfo,
      records: result,
    };

    return sendSuccessResp(c, 200, "Project tasks fetched successfully", finalResponse);
  };

  getTasksStatusByProjectId = async (c: Context) => {
    const projectId = +c.req.param("id");

    if (!projectId) {
      throw new BadRequestException(INVALID_INPUT);
    }

    const projectExists = await getSingleRecordByMultipleColumnValues<Project>(projects, ["id", "deleted_at"], [projectId, null], ["id"]);

    if (!projectExists) {
      throw new NotFoundException(PROJECT_NOT_FOUND_ID);
    }

    const result = await getProjectTaskStatusCounts(projectId);

    return sendSuccessResp(c, 200, "Task status fetched successfully", result);
  };

  getProjectById = async (c: Context) => {
    const projectId = +c.req.param("id");

    if (!projectId) {
      throw new BadRequestException(INVALID_INPUT);
    }

    const projectExists = await getSingleRecordByMultipleColumnValues<Project>(projects, ["id", "deleted_at"], [projectId, null], ["id"]);

    if (!projectExists) {
      throw new NotFoundException(PROJECT_NOT_FOUND_ID);
    }

    const result = await userCreatedProjectById(projectId);

    return sendSuccessResp(c, 200, "Project fetched successfully", result);
  };

  getAllProjectUsersList = async (c: Context) => {
    const query = c.req.query();
    const page = +query.page || 1;
    const pageSize = +(c.req.query("page_size") || 10);
    const offset = (page - 1) * pageSize;
    const search = c.req.query("search_string");
    const orderBy = c.req.query("order_by");
    const projectStatus = c.req.query("status");

    const { result, total_records } = await getAllUsersInProjectWithPagination(
      offset,
      pageSize,
      search,
      orderBy,
      projectStatus,
    );

    const paginationInfo = getPaginationData(page, pageSize, total_records);

    const finalResponse: ProjectUsersResponse = {
      pagination_info: paginationInfo,
      records: result,
    };

    return sendSuccessResp(c, 200, "Project users fetched successfully", finalResponse);
  };
}

export default ProjectController;
