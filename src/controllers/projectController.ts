import type { Context } from "hono";

import type { Project } from "../db/schema/projects.js";
import type { UserProjects } from "../db/schema/userProjects.js";
import type { DBTableColumns, OrderByQueryData, SortDirection, WhereQueryData } from "../types/dbTypes.js";
import type { ValidatedCreateProject } from "../validations/schemas/vProjectSchema.js";

import { PROJECT_ALREADY_EXISTS, PROJECT_CREATED, PROJECT_VALIDATION_ERROR, PROJECTS_FETCHED } from "../constants/appMessages.js";
import { projects } from "../db/schema/projects.js";
import { user_projects } from "../db/schema/userProjects.js";
import ConflictException from "../exceptions/conflictException.js";
import { getPaginatedRecordsConditionally, getSingleRecordByMultipleColumnValues, saveRecords, saveSingleRecord } from "../services/db/baseDbService.js";
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
}

export default ProjectController;
