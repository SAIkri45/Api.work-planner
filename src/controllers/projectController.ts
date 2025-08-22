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
import { deleteRecordsByColumn, getPaginatedRecordsConditionally, getRecordById, getSingleRecordByMultipleColumnValues, saveRecords, saveSingleRecord, softDeleteRecordById, updateRecordById, updateRecordByMultipleColumnValues } from "../services/db/baseDbService.js";
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
    const result = await getPaginatedRecordsConditionally<Project>(projects, page, pageSize, orderByQueryData, WhereQueryData);

    return sendSuccessResp(c, 200, PROJECTS_FETCHED, result);
  };

  updateProject = async (c: Context) => {
    const reqData = await c.req.json();
    const project_id = +(c.req.param("id"));

    const validatedReq = await validateRequest<ValidatedUpdateProject>("update-project", { ...reqData, id: project_id }, PROJECT_VALIDATION_ERROR);

    const projectExists = await getSingleRecordByMultipleColumnValues<Project>(
      projects,
      ["id", "deleted_at"],
      [project_id, null],
      ["id", "title", "deleted_at", "created_by"],
    );

    if (!projectExists) {
      throw new NotFoundException(PROJECT_NOT_FOUND);
    }

    // Update the project record itself (excluding user_ids which is handled separately)
    const { user_ids, ...projectData } = validatedReq;
    const updatedData = await updateRecordById<Project>(projects, project_id, projectData);

    // Handle user_ids relationship updates
    if ("user_ids" in validatedReq) {
      const userIds = [...new Set(validatedReq.user_ids ?? [])];
      // Remove all existing associations for this project
      await deleteRecordsByColumn<UserProjects>(user_projects, "project_id", project_id);

      // Add new associations if there are user_ids
      if (userIds.length > 0) {
        const newRecords = userIds.map(user_id => ({
          project_id, // Use the project_id parameter
          user_id, // Use the user_id from the array
        }));

        await saveRecords<UserProjects>(user_projects, newRecords);
      }

      return sendSuccessResp(c, 200, PROJECT_UPDATED, { ...updatedData, user_ids: userIds });
    }

    // Return response when no user_ids are being updated
    return sendSuccessResp(c, 200, PROJECT_UPDATED, updatedData);
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

    const result = await getRecordById<Project>(projects, projectId);

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
}

export default ProjectController;
