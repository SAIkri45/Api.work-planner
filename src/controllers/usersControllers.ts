import type { Context } from "hono";

import bcrypt from "bcrypt";

import type { User } from "../db/schema/users.js";
import type { WhereQueryData } from "../types/dbTypes.js";
import type { ValidatedAddUser, ValidatedUpdateUserByLoginEmp, ValidatedUpdateUserPassword, ValidatedUpdateUserStatus } from "../validations/schemas/vUserSchema.js";

import { EMPLOYEES_FETCHED, INVALID_INPUT, USER_CREATED, USER_DELETED, USER_EXIST_WITH_EMAIL, USER_FETCHED, USER_ID_REQUIRED, USER_NOT_FOUND, USER_PASSWORD_CHANGED, USER_STATUS, USER_UPDATED, USER_VALIDATION_ERROR, USERS_FETCHED } from "../constants/appMessages.js";
import { users } from "../db/schema/users.js";
import BadRequestException from "../exceptions/badRequestException.js";
import ConflictException from "../exceptions/conflictException.js";
import ForbiddenException from "../exceptions/forbiddenException.js";
import { getPaginationData } from "../helpers/paginationHelper.js";
import { parseOrderByQuery } from "../helpers/parseOrderByHelper.js";
import { getPaginatedRecordsConditionally, getRecordsConditionally, getSingleRecordByMultipleColumnValues, saveSingleRecord, softDeleteRecordById, updateRecordById } from "../services/db/baseDbService.js";
import { getAllRemovedProject } from "../services/db/userService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { validateRequest } from "../validations/validateRequest.js";
import NotFoundException from "./../exceptions/notFoundException.js";

export class UsersController {
  getPaginatedUsers = async (c: Context) => {
    const page = +c.req.query("page")! || 1;
    const pageSize = +c.req.query("page_size")! || 10;
    const searchString = c.req.query("search_string") || null;
    const orderBy = c.req.query("order_by");
    const userType = c.req.query("user_type");

    const orderByQueryData = parseOrderByQuery<User>("created_at", "desc", orderBy);

    const whereQueryData: WhereQueryData<User> = {
      columns: ["deleted_at"],
      values: [null],
    };

    if (userType) {
      whereQueryData.columns.push("user_type");
      whereQueryData.values.push(userType);
    }

    if (searchString) {
      whereQueryData.columns.push("display_name");
      whereQueryData.values.push(`%${searchString}%`);
    }

    const columnsToSelect = ["id", "slack_id", "profile_pic", "designation", "display_name", "phone", "email", "user_type", "user_status", "created_at", "updated_at"] as const;
    const result = await getPaginatedRecordsConditionally<User>(users, page, pageSize, orderByQueryData, whereQueryData, columnsToSelect);

    return sendSuccessResp(c, 200, USERS_FETCHED, result);
  };

  // 2. Dropdown list (id + full_name only)
  getUsersDropdown = async (c: Context) => {
    const searchString = c.req.query("search_string");

    const orderByQueryData = parseOrderByQuery<User>("created_at", "desc");

    const whereQueryData: WhereQueryData<User> = {
      columns: ["user_status", "deleted_at"],
      values: ["ACTIVE", null],
    };

    const columnsToSelect = ["id", "display_name"] as const;

    if (searchString) {
      whereQueryData.columns.push("display_name");
      whereQueryData.values.push(`%${searchString}%`);
    }

    const result = await getRecordsConditionally<User>(users, whereQueryData, columnsToSelect, orderByQueryData);

    return sendSuccessResp(c, 200, USERS_FETCHED, result);
  };

  // 3. Employees list (exclude admins) with pagination
  getEmployeesList = async (c: Context) => {
    const page = +c.req.query("page")! || 1;
    const pageSize = +c.req.query("page_size")! || 10;
    const searchString = c.req.query("search_string")?.trim() || null;

    const whereQueryData: WhereQueryData<User> = {
      columns: ["user_status", "deleted_at"],
      values: ["ACTIVE", null],
    };

    if (searchString) {
      whereQueryData.columns.push("display_name");
      whereQueryData.values.push(`%${searchString}%`);
    }

    const result = await getPaginatedRecordsConditionally<User>(users, page, pageSize, { columns: ["created_at"], values: ["desc"] }, whereQueryData);

    return sendSuccessResp(c, 200, EMPLOYEES_FETCHED, result);
  };

  // get single user by id
  getUserById = async (c: Context) => {
    const userId = +c.req.param("id");

    if (!userId) {
      throw new BadRequestException(USER_ID_REQUIRED);
    }

    const columnsToSelect = ["id", "display_name", "profile_pic", "designation", "phone", "email", "user_type", "user_status", "created_at", "updated_at"] as const;

    const user = await getSingleRecordByMultipleColumnValues<User>(users, ["id", "deleted_at", "user_status"], [userId, null, "ACTIVE"], columnsToSelect);

    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND);
    }

    return sendSuccessResp(c, 200, USER_FETCHED, user);
  };

  updateUser = async (c: Context) => {
    const userId = +c.req.param("id");

    const requestbody = await c.req.json();

    if (!userId) {
      throw new BadRequestException(USER_ID_REQUIRED);
    }

    const validatedReq = await validateRequest<ValidatedUpdateUserByLoginEmp>("update-emp", { ...requestbody, id: userId }, USER_VALIDATION_ERROR);

    const userData = await getSingleRecordByMultipleColumnValues<User>(users, ["id", "deleted_at"], [userId, null], ["id"]);

    if (!userData) {
      throw new NotFoundException(USER_NOT_FOUND);
    }

    const result = await updateRecordById<User>(users, userId, validatedReq);

    return sendSuccessResp(c, 200, USER_UPDATED, result);
  };

  createUserByAdmin = async (c: Context) => {
    const reqBody = await c.req.json();

    const validateReq = await validateRequest<ValidatedAddUser>("create-user-by-admin", reqBody, USER_VALIDATION_ERROR);

    const checkUserExist = await getSingleRecordByMultipleColumnValues<User>(users, ["email"], [validateReq.email], ["email"]);

    if (checkUserExist) {
      throw new ConflictException(USER_EXIST_WITH_EMAIL);
    }

    const hashedPassword = await bcrypt.hash(validateReq.password, 10);

    const { password, ...result } = await saveSingleRecord<User>(users, { ...validateReq, user_name: validateReq.display_name, password: hashedPassword });

    return sendSuccessResp(c, 201, USER_CREATED, result);
  };

  // TODO
  getAllUserRemovedProjects = async (c: Context) => {
    const user = c.get("user_payload");
    const page = +c.req.query("page")! || 1;
    const pageSize = +c.req.query("page_size")! || 10;
    const offset = (page - 1) * pageSize;
    const search = c.req.query("search_string");
    const orderBy = c.req.query("order_by");

    const { result, total_records } = await getAllRemovedProject(
      user.id,
      offset,
      pageSize,
      search,
      orderBy,
    );

    const paginationInfo = getPaginationData(page, pageSize, total_records);

    const finalResponse = {
      pagination_info: paginationInfo,
      records: result,
    };

    return sendSuccessResp(c, 200, "Removed projects fetched successfully", finalResponse);
  };

  // TODO : soft delete
  softDeleteUserById = async (c: Context) => {
    const userId = +c.req.param("id");

    if (!userId) {
      throw new BadRequestException(INVALID_INPUT);
    }

    const user = await getSingleRecordByMultipleColumnValues<User>(users, ["id", "deleted_at" ], [userId, null], ["id", "user_status"]);

    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND);
    }

    await softDeleteRecordById<User>(users, userId, { deleted_at: new Date() });

    return sendSuccessResp(c, 200, USER_DELETED);
  };

  updateUserStatus = async (c: Context) => {
    const userId = +c.req.param("id");

    const requestbody = await c.req.json();

    const validatedReq = await validateRequest<ValidatedUpdateUserStatus>("update-user-status", requestbody, USER_VALIDATION_ERROR);

    if (!userId) {
      throw new BadRequestException(USER_ID_REQUIRED);
    }

    const user = await getSingleRecordByMultipleColumnValues<User>(users, ["id", "deleted_at"], [userId, null], ["id", "user_status"]);

    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND);
    }

    const { password, ...result } = await updateRecordById<User>(users, userId, { user_status: validatedReq.user_status });

    return sendSuccessResp(c, 200, USER_UPDATED, result);
  };

  resetPassword = async (c: Context) => {
    const userId = +c.req.param("id");

    const requestbody = await c.req.json();

    if (!userId) {
      throw new BadRequestException(INVALID_INPUT);
    }

    const validateReq = await validateRequest<ValidatedUpdateUserPassword>("update-user-password", requestbody, USER_VALIDATION_ERROR);

    const user = await getSingleRecordByMultipleColumnValues<User>(users, ["id", "deleted_at", "user_status"], [userId, null, "ACTIVE"], ["id", "user_status"]);

    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND);
    }

    if (user?.user_status !== "ACTIVE") {
      throw new ForbiddenException(USER_STATUS);
    }
    const hashedPassword = await bcrypt.hash(validateReq.password, 10);

    await updateRecordById<User>(users, userId, { password: hashedPassword });

    return sendSuccessResp(c, 200, USER_PASSWORD_CHANGED);
  };
}

export default UsersController;
