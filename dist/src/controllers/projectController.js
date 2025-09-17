import { AVILABLE_USERS_FETCHED, INVALID_INPUT, PROJECT_ALREADY_EXISTS, PROJECT_CREATED, PROJECT_DELETED, PROJECT_NOT_FOUND, PROJECT_NOT_FOUND_ID, PROJECT_STATUS, PROJECT_STATUS_UPDATED, PROJECT_TASKS_IN_COMPLETED, PROJECT_UPDATED, PROJECT_USERS_ASSIGNED, PROJECT_USERS_REMOVED, PROJECT_USERS_VALIDATION_ERROR, PROJECT_VALIDATION_ERROR, PROJECTS_FETCHED, PROJECTS_FETCHED_SUCCESS, PROJECTS_USERS_FETCHED_SUCCESS, TASKS_STATUS_FETCHED, USER_FETCHED } from "../constants/appMessages.js";
import { db } from "../db/configuration.js";
import { projects } from "../db/schema/projects.js";
import { Tasks } from "../db/schema/tasks.js";
import { user_projects } from "../db/schema/userProjects.js";
import BadRequestException from "../exceptions/badRequestException.js";
import ConflictException from "../exceptions/conflictException.js";
import NotFoundException from "../exceptions/notFoundException.js";
import { getPaginationData } from "../helpers/paginationHelper.js";
import { parseOrderByQuery } from "../helpers/parseOrderByHelper.js";
import { buildProjectsWhereQueryData } from "../helpers/projectHelper.js";
import { getPaginatedRecordsConditionally, getRecordsConditionally, getSingleRecordByMultipleColumnValues, saveRecordsWithTrx, saveSingleRecordWithTrx, softDeleteRecordByIdWithTrx, updateRecordById, updateRecordByMultipleColumnValuesWithTrx } from "../services/db/baseDbService.js";
import { assignUsersToProject, checkTaskExist, getAllUsersInProjectWithPagination, getNonExistingUsers, getProjectTaskStatusCounts, getProjectUsersById, getProjectUsersByIdDropdown, getTasksByProjectId, removeUsersFromProject, updateProjectStatus, userCreatedProjectById } from "../services/db/projectService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { validateRequest } from "../validations/validateRequest.js";
class ProjectController {
    createProject = async (c) => {
        try {
            const requestBody = await c.req.json();
            const userDetails = c.get("user_payload");
            const validatedReq = await validateRequest("create-project", requestBody, PROJECT_VALIDATION_ERROR);
            const { assigned_users, ...projectData } = validatedReq;
            const projectExists = await getSingleRecordByMultipleColumnValues(projects, ["title", "deleted_at"], [validatedReq.title, null], ["id"]);
            if (projectExists) {
                throw new ConflictException(PROJECT_ALREADY_EXISTS);
            }
            let insertedData;
            let insertedDataUsers;
            await db.transaction(async (trx) => {
                insertedData = await saveSingleRecordWithTrx(projects, { ...projectData, created_by: userDetails.id }, trx);
                // insertedData = await saveSingleRecordWithTrx<Project>(projects, projectData, trx);
                if (assigned_users?.length) {
                    const userProjectRecords = assigned_users.map(user_id => ({
                        user_id,
                        project_id: insertedData.id,
                    }));
                    insertedDataUsers = await saveRecordsWithTrx(user_projects, userProjectRecords, trx);
                }
            });
            return sendSuccessResp(c, 201, PROJECT_CREATED, { ...insertedData, insertedDataUsers });
        }
        catch (error) {
            console.error("Error at create Project", error.message);
            throw error;
        }
    };
    getAllProjectsPaginated = async (c) => {
        const user = c.get("user_payload");
        const page = +c.req.query("page") || 1;
        const pageSize = +c.req.query("page_size") || 10;
        const searchString = c.req.query("search_string") || null;
        const orderBy = c.req.query("order_by");
        const projectStatus = c.req.query("project_status") || null;
        const startDate = c.req.query("from_date") || null;
        const endDate = c.req.query("to_date") || null;
        let orderByQueryData = {
            columns: ["created_at"],
            values: ["desc"],
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
        const whereQueryData = buildProjectsWhereQueryData(startDate, endDate, projectStatus, searchString, user);
        const columnsToSelect = ["id", "title", "description", "logo_url", "project_status", "start_date", "due_date"];
        const result = await getPaginatedRecordsConditionally(projects, page, pageSize, orderByQueryData, whereQueryData, columnsToSelect);
        return sendSuccessResp(c, 200, PROJECTS_FETCHED, result);
    };
    softDeleteProjectById = async (c) => {
        const projectId = +c.req.param("id");
        if (!projectId) {
            throw new BadRequestException(INVALID_INPUT);
        }
        const projectExists = await getSingleRecordByMultipleColumnValues(projects, ["id", "deleted_at"], [projectId, null], ["id"]);
        if (!projectExists) {
            throw new NotFoundException(PROJECT_NOT_FOUND_ID);
        }
        const incompleteTasks = await checkTaskExist(projectId);
        if (incompleteTasks.length > 0) {
            throw new ConflictException(PROJECT_TASKS_IN_COMPLETED);
        }
        const projectStatus = await getSingleRecordByMultipleColumnValues(projects, ["id", "deleted_at", "project_status"], [projectId, null, "COMPLETED"], ["id"]);
        if (!projectStatus) {
            throw new ConflictException(PROJECT_STATUS);
        }
        await db.transaction(async (trx) => {
            await softDeleteRecordByIdWithTrx(projects, projectId, { deleted_at: new Date() }, trx);
            await updateRecordByMultipleColumnValuesWithTrx(user_projects, ["project_id"], [projectId], { deleted_at: new Date() }, trx);
            await updateRecordByMultipleColumnValuesWithTrx(Tasks, ["project_id"], [projectId], { deleted_at: new Date() }, trx);
        });
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
        const userDetails = c.get("user_payload");
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
        return sendSuccessResp(c, 200, AVILABLE_USERS_FETCHED, result);
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
        return sendSuccessResp(c, 200, TASKS_STATUS_FETCHED, result);
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
        return sendSuccessResp(c, 200, PROJECTS_FETCHED_SUCCESS, result);
    };
    getAllProjectUsersList = async (c) => {
        const user = c.get("user_payload");
        const query = c.req.query();
        const page = +query.page || 1;
        const pageSize = +(c.req.query("page_size") || 10);
        const offset = (page - 1) * pageSize;
        const search = c.req.query("search_string");
        const orderBy = c.req.query("order_by");
        const projectStatus = c.req.query("project_status");
        const { result, total_records } = await getAllUsersInProjectWithPagination(offset, pageSize, search, orderBy, projectStatus, user);
        const paginationInfo = getPaginationData(page, pageSize, total_records);
        const finalResponse = {
            pagination_info: paginationInfo,
            records: result,
        };
        return sendSuccessResp(c, 200, PROJECTS_USERS_FETCHED_SUCCESS, finalResponse);
    };
    updateProjectStatus = async (c) => {
        const projectId = +c.req.param("id");
        const projectStatus = await c.req.json();
        if (!projectId) {
            throw new BadRequestException(INVALID_INPUT);
        }
        const validatedReq = await validateRequest("update-project-status", projectStatus, PROJECT_VALIDATION_ERROR);
        const projectExists = await getSingleRecordByMultipleColumnValues(projects, ["id", "deleted_at"], [projectId, null], ["id"]);
        if (!projectExists) {
            throw new NotFoundException(PROJECT_NOT_FOUND_ID);
        }
        const result = await updateRecordById(projects, projectId, validatedReq);
        return sendSuccessResp(c, 200, PROJECT_STATUS_UPDATED, result);
    };
    updateProjectStatusByCron = async (c) => {
        const result = await updateProjectStatus();
        return sendSuccessResp(c, 200, PROJECT_STATUS_UPDATED, result);
    };
}
export default ProjectController;
