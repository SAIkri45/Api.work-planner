import { parseAsync } from "valibot";
import { EMPLOYEES_FETCHED, FAILED_TO_UPDATE_USER, INVALID_INPUT, USER_FETCHED, USER_NOT_FOUND, USER_UPDATED, USERS_FETCHED, } from "../constants/appMessages.js";
import { users } from "../db/schema/users.js";
import BadRequestException from "../exceptions/badRequestException.js";
import ConflictException from "../exceptions/conflictException.js";
import { parseOrderByQuery } from "../helpers/parseOrderByHelper.js";
import { getPaginatedRecordsConditionally, getRecordsConditionally, getSingleRecordByAColumnValue, getSingleRecordByMultipleColumnValues, saveSingleRecord, updateRecordById, } from "../services/db/baseDbService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { VCreateUserSchema } from "../validations/schemas/vUserSchema.js";
import { validateRequest } from "../validations/validateRequest.js";
import NotFoundException from "./../exceptions/notFoundException.js";
export class UsersController {
    getPaginatedUsers = async (c) => {
        const page = +c.req.query("page") || 1;
        const pageSize = +c.req.query("page_size") || 10;
        const searchString = c.req.query("search_string") || null;
        const orderBy = c.req.query("order_by");
        const userType = c.req.query("user_type");
        let orderByQueryData = {
            columns: ["created_at"],
            values: ["desc"],
        };
        const whereQueryData = {
            columns: ["user_status", "deleted_at"],
            values: ["ACTIVE", null],
        };
        // Parse order by query
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
        if (userType) {
            whereQueryData.columns.push("user_type");
            whereQueryData.values.push(userType);
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
        const searchString = c.req.query("search_string");
        const orderByQueryData = parseOrderByQuery("id", "asc");
        const whereQueryData = {
            columns: ["user_status", "deleted_at"],
            values: ["ACTIVE", null],
        };
        const columnsToSelect = ["id", "display_name"];
        if (searchString) {
            whereQueryData.columns.push("display_name");
            whereQueryData.values.push(`%${searchString}%`);
        }
        const result = await getRecordsConditionally(users, whereQueryData, columnsToSelect, orderByQueryData);
        return sendSuccessResp(c, 200, USERS_FETCHED, result);
    };
    // 3. Employees list (exclude admins) with pagination
    getEmployeesList = async (c) => {
        const page = +c.req.query("page") || 1;
        const pageSize = +c.req.query("page_size") || 10;
        const searchString = c.req.query("search_string")?.trim() || null;
        const whereQueryData = {
            columns: ["user_status", "deleted_at"],
            values: ["ACTIVE", null],
        };
        if (searchString) {
            whereQueryData.columns.push("display_name");
            whereQueryData.values.push(`%${searchString}%`);
        }
        const result = await getPaginatedRecordsConditionally(users, page, pageSize, { columns: ["created_at"], values: ["desc"] }, whereQueryData);
        return sendSuccessResp(c, 200, EMPLOYEES_FETCHED, result);
    };
    // Add user
    updateInternalUser = async (c) => {
        const id = +c.req.param("id");
        const req = await c.req.json();
        if (!id) {
            throw new BadRequestException(INVALID_INPUT);
        }
        const user = await getSingleRecordByMultipleColumnValues(users, ["id", "deleted_at"], [id, null], ["id"]);
        if (!user) {
            throw new NotFoundException(USER_NOT_FOUND);
        }
        const validatedUser = await validateRequest("update-user", req, "VUpdateUserSchema");
        const updatedUser = await updateRecordById(users, id, {
            user_name: validatedUser.user_name,
            email: validatedUser.email,
            phone: validatedUser.phone,
        });
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
    // create user
    addUser = async (c) => {
        const body = await c.req.json();
        const validated = await validateRequest("create-user", body, "VUserCreateSchema");
        const existingUser = await getSingleRecordByAColumnValue(users, "email", validated.email);
        if (existingUser) {
            throw new ConflictException("User already exists with this email");
        }
        const defaultPassword = "123456";
        const newUser = await saveSingleRecord(users, {
            ...validated,
            password: defaultPassword,
        });
        return sendSuccessResp(c, 201, "User created successfully", newUser);
    };
}
export default UsersController;
