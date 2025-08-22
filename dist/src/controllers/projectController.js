import { PROJECT_ALREADY_EXISTS, PROJECT_CREATED, PROJECT_VALIDATION_ERROR, PROJECTS_FETCHED } from "../constants/appMessages.js";
import { projects } from "../db/schema/projects.js";
import { user_projects } from "../db/schema/userProjects.js";
import ConflictException from "../exceptions/conflictException.js";
import { getPaginatedRecordsConditionally, getSingleRecordByMultipleColumnValues, saveRecords, saveSingleRecord } from "../services/db/baseDbService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { validateRequest } from "../validations/validateRequest.js";
class ProjectController {
    createProject = async (c) => {
        const requestBody = await c.req.json();
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
        const result = await getPaginatedRecordsConditionally(projects, page, pageSize, orderByQueryData, WhereQueryData);
        return sendSuccessResp(c, 200, PROJECTS_FETCHED, result);
    };
}
export default ProjectController;
