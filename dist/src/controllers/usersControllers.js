import { USERS_FETCHED } from "../constants/appMessages.js";
import { users } from "../db/schema/users.js";
import { parseOrderByQuery } from "../helpers/parseOrderByHelper.js";
import { getPaginatedRecordsConditionally, getRecordsConditionally } from "../services/db/baseDbService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
export class UsersController {
    // 1. Get paginated users
    getPaginatedUsers = async (c) => {
        const page = +c.req.query("page") || 1;
        const pageSize = +c.req.query("page_size") || 10;
        const searchString = c.req.query("search_string")?.trim() || null;
        const orderBy = c.req.query("order_by");
        const userType = c.req.query("user_type");
        let orderByQueryData = {
            columns: ["created_at"],
            values: ["desc"],
        };
        const whereQueryData = {
            columns: ["user_status"],
            values: ["ACTIVE"],
        };
        if (userType) {
            whereQueryData.columns.push("user_type");
            whereQueryData.values.push(userType);
        }
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
            whereQueryData.columns.push("display_name");
            whereQueryData.values.push(`%${searchString}%`);
        }
        const result = await getPaginatedRecordsConditionally(users, page, pageSize, orderByQueryData, whereQueryData);
        return sendSuccessResp(c, 200, USERS_FETCHED, result);
    };
    getUsersDropdown = async (c) => {
        const searchString = c.req.query("search_string");
        const orderByQueryData = parseOrderByQuery("id", "asc");
        const whereQueryData = {
            columns: ["deleted_at"],
            values: [null],
        };
        const columnsToSelect = ["id", "display_name"];
        if (searchString) {
            // Add search string filter using LIKE
            whereQueryData.columns.push("display_name");
            whereQueryData.values.push(`%${searchString}%`);
        }
        const result = await getRecordsConditionally(users, whereQueryData, columnsToSelect, orderByQueryData);
        return sendSuccessResp(c, 200, "Dropdown users fetched successfully", result);
    };
    // 3. Employees list (exclude admins) with pagination
    getEmployeesList = async (c) => {
        const page = +c.req.query("page") || 1;
        const pageSize = +c.req.query("page_size") || 10;
        const searchString = c.req.query("search_string")?.trim() || null;
        const whereQueryData = {
            columns: ["user_type"],
            values: ["EMPLOYEE"],
        };
        if (searchString) {
            whereQueryData.columns.push("display_name");
            whereQueryData.values.push(`%${searchString}%`);
        }
        const result = await getPaginatedRecordsConditionally(users, page, pageSize, { columns: ["created_at"], values: ["desc"] }, whereQueryData);
        return sendSuccessResp(c, 200, "Employees list fetched successfully", result);
    };
}
export default UsersController;
