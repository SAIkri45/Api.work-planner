import { PROJECTS_FETCHED } from "../constants/appMessages";
import { projects } from "../db/schema/project";
import { getPaginatedRecordsConditionally } from "../services/db/baseDbService";
import { sendSuccessResp } from "../utils/respUtils";
class groupController {
    getAllProjectsPaginated = async (c) => {
        const page = +c.req.query("page") || 1;
        const pageSize = +c.req.query("page_size") || 10;
        const searchString = c.req.query("search_string") || null;
        const orderBy = c.req.query("order_by");
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
        const result = await getPaginatedRecordsConditionally(projects, page, pageSize, orderByQueryData, WhereQueryData);
        return sendSuccessResp(c, 200, PROJECTS_FETCHED, result);
    };
}
export default groupController;
