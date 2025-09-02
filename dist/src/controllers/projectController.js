import { INVALID_INPUT, PROJECT_ALREADY_EXISTS, PROJECT_CREATED, PROJECT_DELETED, PROJECT_NOT_FOUND, PROJECT_NOT_FOUND_ID, PROJECT_UPDATED, PROJECT_USERS_ASSIGNED, PROJECT_USERS_REMOVED, PROJECT_USERS_VALIDATION_ERROR, PROJECT_VALIDATION_ERROR, PROJECTS_FETCHED, USER_FETCHED } from "../constants/appMessages.js";
import { projects } from "../db/schema/projects.js";
import { user_projects } from "../db/schema/userProjects.js";
import BadRequestException from "../exceptions/badRequestException.js";
import ConflictException from "../exceptions/conflictException.js";
import NotFoundException from "../exceptions/notFoundException.js";
import { getPaginationData } from "../helpers/paginationHelper.js";
import { parseOrderByQuery } from "../helpers/parseOrderByHelper.js";
import { getPaginatedRecordsConditionally, getRecordsConditionally, getSingleRecordByMultipleColumnValues, saveRecords, saveSingleRecord, softDeleteRecordById, updateRecordById, updateRecordByMultipleColumnValues } from "../services/db/baseDbService.js";
import { assignUsersToProject, getNonExistingUsers, getProjectTaskStatusCounts, getProjectUsersById, getProjectUsersByIdDropdown, getTasksByProjectId, removeUsersFromProject, userCreatedProjectById } from "../services/db/projectService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { validateRequest } from "../validations/validateRequest.js";
class ProjectController {
    createProject = async (c) => {
        const requestBody = await c.req.json();
        const userDetails = c.get("userDetails");
        console.log("userDetails", userDetails);
        const validatedReq = await validateRequest("create-project", requestBody, PROJECT_VALIDATION_ERROR);
        const columnsToSelect = ["id", "title", "deleted_at", "created_by"];
        const projectExists = await getSingleRecordByMultipleColumnValues(projects, ["title", "deleted_at"], [validatedReq.title, null], columnsToSelect);
        if (projectExists) {
            throw new ConflictException(PROJECT_ALREADY_EXISTS);
        }
        const savedProject = await saveSingleRecord(projects, { ...validatedReq, created_by: userDetails.id });
        // const savedProject = await saveSingleRecord<Project>(projects, validatedReq);
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
        const dueDate = c.req.query("due_date");
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
        if (dueDate) {
            WhereQueryData.columns.push("due_date");
            WhereQueryData.values.push(dueDate);
        }
        const columnsToSelect = ["id", "title", "description", "logo_url", "project_status", "start_date", "due_date"];
        const result = await getPaginatedRecordsConditionally(projects, page, pageSize, orderByQueryData, WhereQueryData, columnsToSelect);
        return sendSuccessResp(c, 200, PROJECTS_FETCHED, result);
    };
    softDeleteProjectById = async (c) => {
        const projectId = +c.req.param("id");
        if (!projectId) {
            throw new BadRequestException(INVALID_INPUT);
        }
        const projectExists = await getSingleRecordByMultipleColumnValues(projects, ["id", "deleted_at", "project_status"], [projectId, null, "COMPLETED"], ["id"]);
        if (!projectExists) {
            throw new NotFoundException(PROJECT_NOT_FOUND_ID);
        }
        await softDeleteRecordById(projects, projectId, { deleted_at: new Date() });
        await updateRecordByMultipleColumnValues(user_projects, ["project_id"], [projectId], { deleted_at: new Date() });
        return sendSuccessResp(c, 200, PROJECT_DELETED);
    };
    getAllProjectsDropDown = async (c) => {
        const searchString = c.req.query("search_string");
        const orderByQueryData = parseOrderByQuery("id", "asc");
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
        const projectId = +c.req.param("id");
        const searchString = c.req.query("search_string");
        if (!projectId) {
            throw new BadRequestException(INVALID_INPUT);
        }
        const projectExists = await getSingleRecordByMultipleColumnValues(projects, ["id", "deleted_at"], [projectId, null], ["id"]);
        if (!projectExists) {
            throw new NotFoundException(PROJECT_NOT_FOUND_ID);
        }
        const result = await getProjectUsersById(projectId, searchString);
        return sendSuccessResp(c, 200, USER_FETCHED, result);
    };
    updateProject = async (c) => {
        const reqData = await c.req.json();
        const userDetails = c.get("userDetails");
        const projectId = +(c.req.param("id"));
        if (!projectId) {
            throw new BadRequestException(INVALID_INPUT);
        }
        const validatedReq = await validateRequest("update-project", reqData, PROJECT_VALIDATION_ERROR);
        const projectExists = await getSingleRecordByMultipleColumnValues(projects, ["id", "deleted_at"], [projectId, null], ["id"]);
        if (!projectExists) {
            throw new NotFoundException(PROJECT_NOT_FOUND);
        }
        const result = await updateRecordById(projects, projectId, { ...validatedReq, updated_by: userDetails.id });
        return sendSuccessResp(c, 200, PROJECT_UPDATED, result);
    };
    assignUsersToProject = async (c) => {
        const projectId = +c.req.param("id");
        const requestBody = await c.req.json();
        if (!projectId) {
            throw new BadRequestException(INVALID_INPUT);
        }
        const validatedReq = await validateRequest("add-users-to-project", { ...requestBody, project_id: projectId }, PROJECT_USERS_VALIDATION_ERROR);
        const { user_ids } = validatedReq;
        const uniqueUserIds = [...new Set(user_ids)];
        const result = await assignUsersToProject(projectId, uniqueUserIds);
        return sendSuccessResp(c, 200, PROJECT_USERS_ASSIGNED, result);
    };
    removeUserFromProject = async (c) => {
        const projectId = +c.req.param("id");
        const reqBody = await c.req.json();
        const validatedReq = await validateRequest("remove-users-from-project", reqBody, PROJECT_USERS_VALIDATION_ERROR);
        if (!projectId) {
            throw new BadRequestException(INVALID_INPUT);
        }
        const uniqueUserIds = [...new Set(validatedReq.user_ids)];
        await removeUsersFromProject(projectId, uniqueUserIds);
        return sendSuccessResp(c, 200, PROJECT_USERS_REMOVED);
    };
    getProjectBasedAssignedUsers = async (c) => {
        const projectId = +c.req.param("id");
        const searchString = c.req.query("search_string");
        if (!projectId) {
            throw new BadRequestException(INVALID_INPUT);
        }
        const existedProject = await getSingleRecordByMultipleColumnValues(projects, ["id", "deleted_at"], [projectId, null], ["id"]);
        if (!existedProject) {
            throw new NotFoundException(PROJECT_NOT_FOUND);
        }
        const result = await getProjectUsersByIdDropdown(projectId, searchString);
        return sendSuccessResp(c, 200, USER_FETCHED, result);
    };
    getAllNonExistingUsers = async (c) => {
        const projectId = +c.req.param("id");
        const searchString = c.req.query("search_string");
        if (!projectId) {
            throw new BadRequestException(INVALID_INPUT);
        }
        const projectExists = await getSingleRecordByMultipleColumnValues(projects, ["id", "deleted_at"], [projectId, null], ["id"]);
        if (!projectExists) {
            throw new NotFoundException(PROJECT_NOT_FOUND);
        }
        const result = await getNonExistingUsers(projectId, searchString);
        return sendSuccessResp(c, 200, "Non-existing users fetched successfully", result);
    };
    getAllTasksByProjectId = async (c) => {
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
        const projectExists = await getSingleRecordByMultipleColumnValues(projects, ["id", "deleted_at"], [projectId, null], ["id"]);
        if (!projectExists) {
            throw new NotFoundException(PROJECT_NOT_FOUND);
        }
        const { result, total_records } = await getTasksByProjectId(projectId, search, offset, pageSize, orderBy, taskStatus, dueDate);
        const paginationInfo = getPaginationData(page, pageSize, total_records);
        const finalResponse = {
            pagination_info: paginationInfo,
            records: result,
        };
        return sendSuccessResp(c, 200, "Project tasks fetched successfully", finalResponse);
    };
    getTasksStatusByProjectId = async (c) => {
        const projectId = +c.req.param("id");
        if (!projectId) {
            throw new BadRequestException(INVALID_INPUT);
        }
        const projectExists = await getSingleRecordByMultipleColumnValues(projects, ["id", "deleted_at"], [projectId, null], ["id"]);
        if (!projectExists) {
            throw new NotFoundException(PROJECT_NOT_FOUND_ID);
        }
        const result = await getProjectTaskStatusCounts(projectId);
        return sendSuccessResp(c, 200, "Task status fetched successfully", result);
    };
    getProjectById = async (c) => {
        const projectId = +c.req.param("id");
        if (!projectId) {
            throw new BadRequestException(INVALID_INPUT);
        }
        const projectExists = await getSingleRecordByMultipleColumnValues(projects, ["id", "deleted_at"], [projectId, null], ["id"]);
        if (!projectExists) {
            throw new NotFoundException(PROJECT_NOT_FOUND_ID);
        }
        const result = await userCreatedProjectById(projectId);
        return sendSuccessResp(c, 200, "Project fetched successfully", result);
    };
}
export default ProjectController;
