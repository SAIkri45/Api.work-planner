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
    createProject = async (c) => {
        const requestBody = await c.req.json();
        const userDetails = c.get("userDetails");
        console.log("userId------>: ", userDetails.id);
        const validatedReq = await validateRequest("create-project", requestBody, PROJECT_VALIDATION_ERROR);
        const columnsToSelect = ["id", "title", "deleted_at", "created_by"];
        const projectExists = await getSingleRecordByMultipleColumnValues(projects, ["title", "deleted_at"], [validatedReq.title, null], columnsToSelect);
        if (projectExists) {
            throw new ConflictException(PROJECT_ALREADY_EXISTS);
        }
        const savedProject = await saveSingleRecord(projects, validatedReq);
        if (validatedReq.user_ids?.length) {
            const userProjectRecords = validatedReq.user_ids.map(user_id => ({
                user_id,
                project_id: savedProject.id,
            }));
            await saveRecords(user_projects, userProjectRecords);
            return sendSuccessResp(c, 200, PROJECT_CREATED, { ...savedProject, user_ids: validatedReq.user_ids });
        }
        return sendSuccessResp(c, 200, PROJECT_CREATED, savedProject);
    };
    getAllProjectsPaginated = async (c) => {
        const page = +c.req.query("page") || 1;
        const pageSize = +c.req.query("page_size") || 10;
        const searchString = c.req.query("search_string") || null;
        const orderBy = c.req.query("order_by");
        const projectStatus = c.req.query("project_status")?.toLocaleUpperCase() || null;
        let orderByQueryData = {
            columns: ["created_at"],
            values: ["desc"],
        };
        const WhereQueryData = {
            columns: ["deleted_at"],
            values: ["null"],
        };
        if (orderBy) {
            const orderByColumns = [];
            const orderByValues = [];
            const queryStrings = orderBy.split(",");
            for (const queryString of queryStrings) {
                const [column, value] = queryString.split(":");
                orderByColumns.push(column);
                orderByValues.push(value);
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
        const columnsToSelect = ["id", "title", "description", "logo_url", "project_status", "start_date", "due_date"];
        const result = await getPaginatedRecordsConditionally(projects, page, pageSize, orderByQueryData, WhereQueryData, columnsToSelect);
        return sendSuccessResp(c, 200, PROJECTS_FETCHED, result);
    };
    getProjectById = async (c) => {
        const projectId = +c.req.param("id");
        if (!projectId) {
            throw new BadRequestException(INVALID_INPUT);
        }
        const projectExists = await getSingleRecordByMultipleColumnValues(projects, ["id", "deleted_at"], [projectId, null], ["id", "title", "description", "created_by"]);
        if (!projectExists) {
            throw new NotFoundException(PROJECT_NOT_FOUND_ID);
        }
        const columnsToSelect = ["id", "title", "description", "logo_url", "project_status", "created_by", "updated_by", "start_date", "due_date"];
        const result = await getSingleRecordByMultipleColumnValues(projects, ["id", "deleted_at"], [projectId, null], columnsToSelect);
        return sendSuccessResp(c, 200, PROJECTS_FETCHED_SUCCESS, result);
    };
    softDeleteProjectById = async (c) => {
        const projectId = +c.req.param("id");
        if (!projectId) {
            throw new BadRequestException(INVALID_INPUT);
        }
        const projectExists = await getSingleRecordByMultipleColumnValues(projects, ["id", "deleted_at"], [projectId, null], ["id", "title", "created_by"]);
        if (!projectExists) {
            throw new NotFoundException(PROJECT_NOT_FOUND_ID);
        }
        await softDeleteRecordById(projects, projectId, { deleted_at: new Date() });
        await updateRecordByMultipleColumnValues(user_projects, ["project_id"], [projectId], { deleted_at: new Date() });
        return sendSuccessResp(c, 200, PROJECT_DELETED);
    };
    getAllProjectsDropDown = async (c) => {
        const searchString = c.req.query("search_string") || null;
        const orderByQueryData = parseOrderByQuery(undefined, "id", "asc");
        const whereQueryData = {
            columns: ["deleted_at"],
            values: [null],
        };
        const columnsToSelect = ["id", "title"];
        if (searchString) {
            // Add search string filter using LIKE
            whereQueryData.columns.push("title");
            whereQueryData.values.push(`%${searchString}%`);
        }
        const result = await getRecordsConditionally(projects, whereQueryData, columnsToSelect, orderByQueryData);
        return sendSuccessResp(c, 200, PROJECTS_FETCHED, result);
    };
    getProjectUsersById = async (c) => {
        const projectId = +c.req.param("project_id");
        if (!projectId) {
            throw new BadRequestException(INVALID_INPUT);
        }
        const projectExists = await getSingleRecordByMultipleColumnValues(projects, ["id", "deleted_at"], [projectId, null], ["id", "title", "description", "created_by"]);
        if (!projectExists) {
            throw new NotFoundException(PROJECT_NOT_FOUND_ID);
        }
        const result = await getProjectUsersById(projectId);
        return sendSuccessResp(c, 200, PROJECTS_FETCHED_SUCCESS, result);
    };
    updateProject = async (c) => {
        const reqData = await c.req.json();
        const project_id = +(c.req.param("id"));
        const validatedReq = await validateRequest("update-project", { ...reqData, id: project_id }, PROJECT_VALIDATION_ERROR);
        const projectExists = await getSingleRecordByMultipleColumnValues(projects, ["id", "deleted_at"], [project_id, null], ["id", "title", "deleted_at", "created_by"]);
        if (!projectExists) {
            throw new NotFoundException(PROJECT_NOT_FOUND);
        }
        const { user_ids, ...projectData } = validatedReq;
        const updatedData = await updateRecordById(projects, project_id, projectData);
        if ("user_ids" in validatedReq && validatedReq.user_ids) {
            const incomingUserIds = [...new Set(validatedReq.user_ids)];
            const existingUserProjects = await getMultipleRecordsByAColumnValue(user_projects, "project_id", project_id, ["user_id"]);
            const existingUserIds = existingUserProjects.map(up => up.user_id);
            const newUserIds = incomingUserIds.filter(userId => !existingUserIds.includes(userId));
            //  add new user_ids (append, don't replace)
            if (newUserIds.length > 0) {
                const newRecords = newUserIds.map(user_id => ({
                    project_id,
                    user_id,
                }));
                await saveRecords(user_projects, newRecords);
            }
            const finalUserIds = [...existingUserIds, ...newUserIds];
            return sendSuccessResp(c, 200, PROJECT_UPDATED, { ...updatedData, user_ids: finalUserIds });
        }
        return sendSuccessResp(c, 200, PROJECT_UPDATED, updatedData);
    };
}
export default ProjectController;
