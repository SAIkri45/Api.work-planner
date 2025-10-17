import bcrypt from "bcrypt";
import { INVALID_INPUT, USER_CREATED, USER_DELETED, USER_EXIST_WITH_EMAIL, USER_FETCHED, USER_ID_REQUIRED, USER_NOT_FOUND, USER_PASSWORD_CHANGED, USER_STATUS, USER_UPDATED, USER_VALIDATION_ERROR, USERS_FETCHED } from "../constants/appMessages.js";
import { users } from "../db/schema/users.js";
import BadRequestException from "../exceptions/badRequestException.js";
import ConflictException from "../exceptions/conflictException.js";
import ForbiddenException from "../exceptions/forbiddenException.js";
import { parseOrderByQuery } from "../helpers/parseOrderByHelper.js";
import { getPaginatedRecordsConditionally, getRecordsConditionally, getSingleRecordByMultipleColumnValues, saveSingleRecord, softDeleteRecordById, updateRecordById } from "../services/db/baseDbService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { validateRequest } from "../validations/validateRequest.js";
import NotFoundException from "./../exceptions/notFoundException.js";
export class UsersController {
    getPaginatedUsers = async (c) => {
        const user = c.get("user_payload");
        const page = +c.req.query("page") || 1;
        const pageSize = +(c.req.query("page_size") || 10);
        const searchString = c.req.query("search_string");
        const designation = c.req.query("designation");
        const orderBy = c.req.query("order_by");
        const userType = c.req.query("user_type");
        const orderByQueryData = parseOrderByQuery("created_at", "desc", orderBy);
        const whereQueryData = {
            columns: ["deleted_at", "id"],
            values: [null, user.id],
            relations: ["eq", "ne"],
        };
        if (userType) {
            whereQueryData.columns.push("user_type");
            whereQueryData.values.push(userType);
        }
        if (searchString) {
            whereQueryData.columns.push("display_name");
            whereQueryData.values.push(`%${searchString}%`);
        }
        if (designation) {
            whereQueryData.columns.push("designation");
            whereQueryData.values.push(`%${designation}%`);
        }
        const columnsToSelect = ["id", "slack_id", "profile_pic", "designation", "display_name", "phone", "email", "user_type", "user_status", "created_at", "updated_at"];
        const result = await getPaginatedRecordsConditionally(users, page, pageSize, orderByQueryData, whereQueryData, columnsToSelect);
        return sendSuccessResp(c, 200, USERS_FETCHED, result);
    };
    getUsersDropdown = async (c) => {
        const searchString = c.req.query("search_string");
        const user = c.get("user_payload");
        const orderByQueryData = parseOrderByQuery("display_name", "asc");
        const whereQueryData = {
            columns: ["user_status", "deleted_at", "id"],
            values: ["ACTIVE", null, user.id],
            relations: ["eq", "eq", "ne"],
        };
        const columnsToSelect = ["id", "display_name"];
        if (searchString) {
            whereQueryData.columns.push("display_name");
            whereQueryData.values.push(`%${searchString}%`);
        }
        const result = await getRecordsConditionally(users, whereQueryData, columnsToSelect, orderByQueryData);
        return sendSuccessResp(c, 200, USERS_FETCHED, result);
    };
    getUserById = async (c) => {
        const userId = +c.req.param("id");
        if (!userId) {
            throw new BadRequestException(USER_ID_REQUIRED);
        }
        const columnsToSelect = ["id", "display_name", "profile_pic", "designation", "phone", "email", "user_type", "user_status", "created_at", "updated_at"];
        const user = await getSingleRecordByMultipleColumnValues(users, ["id", "deleted_at", "user_status"], [userId, null, "ACTIVE"], columnsToSelect);
        if (!user) {
            throw new NotFoundException(USER_NOT_FOUND);
        }
        return sendSuccessResp(c, 200, USER_FETCHED, user);
    };
    updateUser = async (c) => {
        const userId = +c.req.param("id");
        const requestbody = await c.req.json();
        if (!userId) {
            throw new BadRequestException(USER_ID_REQUIRED);
        }
        const validatedReq = await validateRequest("update-emp", { ...requestbody, id: userId }, USER_VALIDATION_ERROR);
        const userData = await getSingleRecordByMultipleColumnValues(users, ["id", "deleted_at"], [userId, null]);
        if (!userData) {
            throw new NotFoundException(USER_NOT_FOUND);
        }
        const { password, ...result } = await updateRecordById(users, userId, validatedReq);
        return sendSuccessResp(c, 200, USER_UPDATED, result);
    };
    createUserByAdmin = async (c) => {
        const reqBody = await c.req.json();
        const validateReq = await validateRequest("create-user-by-admin", reqBody, USER_VALIDATION_ERROR);
        const checkUserExist = await getSingleRecordByMultipleColumnValues(users, ["email"], [validateReq.email], ["email"]);
        if (checkUserExist) {
            throw new ConflictException(USER_EXIST_WITH_EMAIL);
        }
        const hashedPassword = await bcrypt.hash(validateReq.password, 10);
        const { password, ...result } = await saveSingleRecord(users, { ...validateReq, user_name: validateReq.display_name, password: hashedPassword });
        return sendSuccessResp(c, 201, USER_CREATED, result);
    };
    softDeleteUserById = async (c) => {
        const userId = +c.req.param("id");
        if (!userId) {
            throw new BadRequestException(USER_ID_REQUIRED);
        }
        const user = await getSingleRecordByMultipleColumnValues(users, ["id", "deleted_at"], [userId, null], ["id", "user_status"]);
        if (!user) {
            throw new NotFoundException(USER_NOT_FOUND);
        }
        await softDeleteRecordById(users, userId, { deleted_at: new Date() });
        return sendSuccessResp(c, 200, USER_DELETED);
    };
    updateUserStatus = async (c) => {
        const userId = +c.req.param("id");
        const requestbody = await c.req.json();
        const validatedReq = await validateRequest("update-user-status", requestbody, USER_VALIDATION_ERROR);
        if (!userId) {
            throw new BadRequestException(USER_ID_REQUIRED);
        }
        const user = await getSingleRecordByMultipleColumnValues(users, ["id", "deleted_at"], [userId, null], ["id", "user_status"]);
        if (!user) {
            throw new NotFoundException(USER_NOT_FOUND);
        }
        const { password, ...result } = await updateRecordById(users, userId, { user_status: validatedReq.user_status });
        return sendSuccessResp(c, 200, USER_UPDATED, result);
    };
    resetPassword = async (c) => {
        const userId = +c.req.param("id");
        const requestbody = await c.req.json();
        if (!userId) {
            throw new BadRequestException(INVALID_INPUT);
        }
        const validateReq = await validateRequest("update-user-password", requestbody, USER_VALIDATION_ERROR);
        const user = await getSingleRecordByMultipleColumnValues(users, ["id", "deleted_at"], [userId, null], ["id", "user_status"]);
        if (!user) {
            throw new NotFoundException(USER_NOT_FOUND);
        }
        if (user?.user_status !== "ACTIVE") {
            throw new ForbiddenException(USER_STATUS);
        }
        const hashedPassword = await bcrypt.hash(validateReq.password, 10);
        await updateRecordById(users, userId, { password: hashedPassword });
        return sendSuccessResp(c, 200, USER_PASSWORD_CHANGED);
    };
}
export default UsersController;
