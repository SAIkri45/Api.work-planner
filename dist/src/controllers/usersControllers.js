import bcrypt from "bcrypt";
import { parseAsync } from "valibot";
import { EMPLOYEES_FETCHED, FAILED_TO_UPDATE_USER, INVALID_INPUT, USER_CREATED_SUCCESSFULLY, USER_EXIST_WITH_EMAIL, USER_FETCHED, USER_NOT_FOUND, USER_UPDATED, USERS_FETCHED } from "../constants/appMessages.js";
import { users } from "../db/schema/users.js";
import BadRequestException from "../exceptions/badRequestException.js";
import ConflictException from "../exceptions/conflictException.js";
import { parseOrderByQuery } from "../helpers/parseOrderByHelper.js";
import { getPaginatedRecordsConditionally, getRecordsConditionally, getSingleRecordByAColumnValue, getSingleRecordByMultipleColumnValues, saveSingleRecord, updateRecordById } from "../services/db/baseDbService.js";
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
        const orderByQueryData = parseOrderByQuery("created_at", "desc", orderBy);
        const whereQueryData = {
            columns: ["user_status", "deleted_at", "display_name"],
            values: ["ACTIVE", null, null],
        };
        if (userType) {
            whereQueryData.columns.push("user_type");
            whereQueryData.values.push(userType);
        }
        if (searchString) {
            whereQueryData.columns.push("display_name");
            whereQueryData.values.push(`%${searchString}%`);
        }
        const columnsToSelect = ["id", "slack_id", "profile_pic", "designation", "display_name", "phone", "email", "user_type", "user_status", "created_at", "updated_at"];
        const result = await getPaginatedRecordsConditionally(users, page, pageSize, orderByQueryData, whereQueryData, columnsToSelect);
        return sendSuccessResp(c, 200, USERS_FETCHED, result);
    };
    // 2. Dropdown list (id + full_name only)
    getUsersDropdown = async (c) => {
        const searchString = c.req.query("search_string");
        const orderByQueryData = parseOrderByQuery("created_at", "desc");
        const whereQueryData = {
            columns: ["user_status", "deleted_at", "display_name"],
            values: ["ACTIVE", null, null],
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
    createUserByAdmin = async (c) => {
        const reqBody = await c.req.json();
        const validateReq = await validateRequest("create-user-by-admin", reqBody, "VAddUserSchema");
        const checkUserExist = await getSingleRecordByMultipleColumnValues(users, ["email"], [validateReq.email], ["email"]);
        if (checkUserExist) {
            throw new ConflictException(USER_EXIST_WITH_EMAIL);
        }
        const hashedPassword = await bcrypt.hash(validateReq.password, 10);
        const { password, ...result } = await saveSingleRecord(users, { ...validateReq, password: hashedPassword });
        return sendSuccessResp(c, 201, USER_CREATED_SUCCESSFULLY, result);
    };
}
export default UsersController;
