import { USERS_FETCHED, FAILED_TO_FETCH_USERS, EMPLOYEES_FETCHED, USER_VALIDATION_ERROR, USER_NOT_FOUND, USER_FETCHED, FAILED_TO_UPDATE_USER, INVALID_INPUT, USER_UPDATED, } from "../constants/appMessages.js";
import { users } from "../db/schema/users.js";
import { getPaginatedRecordsConditionally, getRecordsConditionally, getSingleRecordByMultipleColumnValues, updateRecordById, getRecordById } from "../services/db/baseDbService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import BadRequestException from "../exceptions/badRequestException.js";
import { validateRequest } from "../validations/validateRequest.js";
import { VCreateUserSchema } from "../validations/schemas/vUserSchema.js";
import { parseAsync } from "valibot";
import NotFoundException from "./../exceptions/notFoundException";
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
    // 2. Dropdown list (id + full_name only)
    getUsersDropdown = async (c) => {
        try {
            const searchString = c.req.query("search_string")?.trim() || null;
            const whereQueryData = {
                columns: ["user_status"],
                values: ["ACTIVE"],
            };
            if (searchString) {
                whereQueryData.columns.push("display_name");
                whereQueryData.values.push(`%${searchString}%`);
            }
            const result = await getRecordsConditionally(users, whereQueryData, ["id", "display_name"], { columns: ["created_at"], values: ["asc"] });
            return sendSuccessResp(c, 200, USERS_FETCHED, result);
        }
        catch (err) {
            throw new BadRequestException(FAILED_TO_FETCH_USERS);
        }
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
        return sendSuccessResp(c, 200, EMPLOYEES_FETCHED, result);
    };
    //Add user
    updateInternalUser = async (c) => {
        const id = +c.req.param("id");
        const req = await c.req.json();
        if (!id) {
            throw new BadRequestException(INVALID_INPUT);
        }
        const user = await getRecordById(users, id);
        if (!user || user.deleted_at !== null || user?.user_status !== "ACTIVE" || !user) {
            throw new NotFoundException(USER_NOT_FOUND);
        }
        const validatedUser = await validateRequest("update-user", req, USER_VALIDATION_ERROR);
        const updatedUser = await updateRecordById(users, id, validatedUser);
        return sendSuccessResp(c, 200, USER_UPDATED, updatedUser);
    };
    // get single user by id
    getUserById = async (c) => {
        const userId = Number(c.req.param("id"));
        const user = await getSingleRecordByMultipleColumnValues(users, ["id", "deleted_at"], [userId, null]);
        if (!user) {
            throw new NotFoundException(USER_NOT_FOUND);
        }
        return sendSuccessResp(c, 200, USER_FETCHED, user);
    };
    // edit user by id
    editUser = async (c) => {
        try {
            const userId = Number(c.req.param("id"));
            if (isNaN(userId) || userId <= 0) {
                throw new BadRequestException("Invalid user ID");
            }
            const requestBody = await c.req.json();
            const existingUser = await getSingleRecordByMultipleColumnValues(users, ["id", "deleted_at"], [userId, null]);
            if (!existingUser) {
                throw new NotFoundException(USER_NOT_FOUND);
            }
            const validatedReq = await parseAsync(VCreateUserSchema, requestBody);
            await updateRecordById(users, userId, validatedReq);
            const updatedUser = await getSingleRecordByMultipleColumnValues(users, ["id", "deleted_at"], [userId, null]);
            return sendSuccessResp(c, 200, USER_UPDATED, updatedUser);
        }
        catch (err) {
            throw new BadRequestException(FAILED_TO_UPDATE_USER);
        }
    };
}
export default UsersController;
