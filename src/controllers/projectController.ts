import type { Context } from "hono";

import type { Project } from "../db/schema/projects.js";
import type { UserProjects } from "../db/schema/userProjects.js";
import type { DBTableColumns, OrderByQueryData, SortDirection, WhereQueryData } from "../types/dbTypes.js";
import type { ValidatedCreateProject, ValidatedUpdateProject } from "../validations/schemas/vProjectSchema.js";

import { INVALID_INPUT, PROJECT_ALREADY_EXISTS, PROJECT_CREATED, PROJECT_DELETED, PROJECT_NOT_FOUND, PROJECT_NOT_FOUND_ID, PROJECT_UPDATED, PROJECT_VALIDATION_ERROR, PROJECTS_FETCHED, PROJECTS_FETCHED_SUCCESS } from "../constants/appMessages.js";
import { projects } from "../db/schema/projects.js";
import { user_projects } from "../db/schema/userProjects.js";
import BadRequestException from "../exceptions/badRequestException.js";
import ConflictException from "../exceptions/conflictException.js";
import NotFoundException from "../exceptions/notFoundException.js";
import { parseOrderByQuery } from "../helpers/parseOrderByHelper.js";
import { getMultipleRecordsByAColumnValue, getPaginatedRecordsConditionally, getRecordsConditionally, getSingleRecordByMultipleColumnValues, saveRecords, saveSingleRecord, softDeleteRecordById, updateRecordById, updateRecordByMultipleColumnValues } from "../services/db/baseDbService.js";
import { getProjectUsersById } from "../services/db/projectService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { validateRequest } from "../validations/validateRequest.js";

class ProjectController {
  createProject = async (c: Context) => {
    const requestBody = await c.req.json();

    const validatedReq = await validateRequest<ValidatedCreateProject>("create-project", requestBody, PROJECT_VALIDATION_ERROR);

    const columnsToSelect = ["id", "title", "deleted_at", "created_by"] as const;

    const projectExists = await getSingleRecordByMultipleColumnValues<Project>(projects, ["title", "deleted_at"], [validatedReq.title, null], columnsToSelect);

    if (projectExists) {
      throw new ConflictException(PROJECT_ALREADY_EXISTS);
    }

    const savedProject = await saveSingleRecord<Project>(projects, validatedReq);

    if (validatedReq.user_ids?.length) {
      const userProjectRecords = validatedReq.user_ids.map(user_id => ({
        user_id,
        project_id: savedProject.id,
      }));

      await saveRecords<UserProjects>(user_projects, userProjectRecords);

      return sendSuccessResp(c, 200, PROJECT_CREATED, { ...savedProject, user_ids: validatedReq.user_ids });
    }

    return sendSuccessResp(c, 200, PROJECT_CREATED, savedProject);
  };

  getAllProjectsPaginated = async (c: Context) => {
    const page = +c.req.query("page")! || 1;
    const pageSize = +c.req.query("page_size")! || 10;
    const searchString = c.req.query("search_string") || null;
    const orderBy = c.req.query("order_by");
    const projectStatus = c.req.query("project_status")?.toLocaleUpperCase() || null;

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

    const columnsToSelect = ["id", "title", "description", "logo_url", "project_status", "start_date", "due_date"] as const;

    const result = await getPaginatedRecordsConditionally<Project>(projects, page, pageSize, orderByQueryData, WhereQueryData, columnsToSelect);

    return sendSuccessResp(c, 200, PROJECTS_FETCHED, result);
  };

  getProjectById = async (c: Context) => {
    const projectId = +c.req.param("id");

    if (!projectId) {
      throw new BadRequestException(INVALID_INPUT);
    }

    const projectExists = await getSingleRecordByMultipleColumnValues<Project>(projects, ["id", "deleted_at"], [projectId, null], ["id", "title", "description", "created_by"]);

    if (!projectExists) {
      throw new NotFoundException(PROJECT_NOT_FOUND_ID);
    }

    const columnsToSelect = ["id", "title", "description", "logo_url", "project_status", "created_by", "updated_by", "start_date", "due_date"] as const;

    const result = await getSingleRecordByMultipleColumnValues<Project>(projects, ["id", "deleted_at"], [projectId, null], columnsToSelect);

    return sendSuccessResp(c, 200, PROJECTS_FETCHED_SUCCESS, result);
  };

  softDeleteProjectById = async (c: Context) => {
    const projectId = +c.req.param("id");

    if (!projectId) {
      throw new BadRequestException(INVALID_INPUT);
    }

    const projectExists = await getSingleRecordByMultipleColumnValues<Project>(projects, ["id", "deleted_at"], [projectId, null], ["id", "title", "created_by"]);

    if (!projectExists) {
      throw new NotFoundException(PROJECT_NOT_FOUND_ID);
    }

    await softDeleteRecordById<Project>(projects, projectId, { deleted_at: new Date() });

    await updateRecordByMultipleColumnValues<UserProjects>(user_projects, ["project_id"], [projectId], { deleted_at: new Date() });
    return sendSuccessResp(c, 200, PROJECT_DELETED);
  };

  getAllProjectsDropDown = async (c: Context) => {
    const searchString = c.req.query("search_string") || null;

    const orderByQueryData = parseOrderByQuery<Project>(undefined, "id", "asc");

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
    const projectId = +c.req.param("project_id");

    if (!projectId) {
      throw new BadRequestException(INVALID_INPUT);
    }

    const projectExists = await getSingleRecordByMultipleColumnValues<Project>(projects, ["id", "deleted_at"], [projectId, null], ["id", "title", "description", "created_by"]);

    if (!projectExists) {
      throw new NotFoundException(PROJECT_NOT_FOUND_ID);
    }

    const result = await getProjectUsersById(projectId);

    return sendSuccessResp(c, 200, PROJECTS_FETCHED_SUCCESS, result);
  };

  updateProject = async (c: Context) => {
    const reqData = await c.req.json();
    const project_id = +(c.req.param("id"));

    const validatedReq = await validateRequest<ValidatedUpdateProject>("update-project", { ...reqData, id: project_id }, PROJECT_VALIDATION_ERROR);

    const projectExists = await getSingleRecordByMultipleColumnValues<Project>(projects, ["id", "deleted_at"], [project_id, null], ["id", "title", "deleted_at", "created_by"]);

    if (!projectExists) {
      throw new NotFoundException(PROJECT_NOT_FOUND);
    }

    const { user_ids, ...projectData } = validatedReq;

    const updatedData = await updateRecordById<Project>(projects, project_id, projectData);

    if ("user_ids" in validatedReq && validatedReq.user_ids) {
      const incomingUserIds = [...new Set(validatedReq.user_ids)];

      const existingUserProjects = await getMultipleRecordsByAColumnValue<UserProjects>(user_projects, "project_id", project_id, ["user_id"]);

      const existingUserIds = existingUserProjects.map(up => up.user_id);

      const newUserIds = incomingUserIds.filter(userId => !existingUserIds.includes(userId));

      //  add new user_ids (append, don't replace)
      if (newUserIds.length > 0) {
        const newRecords = newUserIds.map(user_id => ({
          project_id,
          user_id,
        }));

        await saveRecords<UserProjects>(user_projects, newRecords);
      }

      const finalUserIds = [...existingUserIds, ...newUserIds];

      return sendSuccessResp(c, 200, PROJECT_UPDATED, { ...updatedData, user_ids: finalUserIds });
    }

    return sendSuccessResp(c, 200, PROJECT_UPDATED, updatedData);
  };
}

export default ProjectController;
