import type { Context } from "hono";

import { parseAsync } from "valibot";

import type { User } from "../db/schema/users.js";
import type { WhereQueryData } from "../types/dbTypes.js";
import type { ValidatedCreateUserOrAdmin, ValidatedUpdateUser } from "../validations/schemas/vUserSchema.js";

import { EMPLOYEES_FETCHED, FAILED_TO_UPDATE_USER, INVALID_INPUT, USER_FETCHED, USER_NOT_FOUND, USER_UPDATED, USERS_FETCHED } from "../constants/appMessages.js";
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
  getPaginatedUsers = async (c: Context) => {
    const page = +c.req.query("page")! || 1;
    const pageSize = +c.req.query("page_size")! || 10;
    const searchString = c.req.query("search_string") || null;
    const orderBy = c.req.query("order_by");
    const userType = c.req.query("user_type");

    const orderByQueryData = parseOrderByQuery<User>("created_at", "desc", orderBy);

    const whereQueryData: WhereQueryData<User> = {
      columns: ["user_status", "deleted_at"],
      values: ["ACTIVE", null],
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

  // Add user
  updateInternalUser = async (c: Context) => {
    const id = +c.req.param("id");
    const req = await c.req.json();

    if (!id) {
      throw new BadRequestException(INVALID_INPUT);
    }

    const user = await getSingleRecordByMultipleColumnValues<User>(users, ["id", "deleted_at"], [id, null], ["id"]);

    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND);
    }

    const validatedUser: ValidatedUpdateUser = await validateRequest("update-user", req, "VUpdateUserSchema");

    const updatedUser = await updateRecordById<User>(users, id, {
      user_name: validatedUser.user_name,
      email: validatedUser.email,
      phone: validatedUser.phone,
    });

    return sendSuccessResp(c, 200, USER_UPDATED, updatedUser);
  };

  // get single user by id
  getUserById = async (c: Context) => {
    const userId = Number(c.req.param("id"));

    const user = await getSingleRecordByMultipleColumnValues<User>(users, ["id", "deleted_at"], [userId, null]);

    if (!user) {
      throw new NotFoundException(USER_NOT_FOUND);
    }

    return sendSuccessResp(c, 200, USER_FETCHED, user);
  };

  // edit user by id
  editUser = async (c: Context) => {
    try {
      const userId = Number(c.req.param("id"));
      if (isNaN(userId) || userId <= 0) {
        throw new BadRequestException("Invalid user ID");
      }

      const requestBody = await c.req.json();

      const existingUser = await getSingleRecordByMultipleColumnValues<User>(users, ["id", "deleted_at"], [userId, null]);

      if (!existingUser) {
        throw new NotFoundException(USER_NOT_FOUND);
      }

      const validatedReq = await parseAsync(VCreateUserSchema, requestBody);

      await updateRecordById<User>(users, userId, validatedReq);

      const updatedUser = await getSingleRecordByMultipleColumnValues<User>(users, ["id", "deleted_at"], [userId, null]);

      return sendSuccessResp(c, 200, USER_UPDATED, updatedUser);
    }
    catch (err) {
      throw new BadRequestException(FAILED_TO_UPDATE_USER);
    }
  };

  // create user
  addUser = async (c: Context) => {
    const body = await c.req.json();

    const validated = await validateRequest<ValidatedCreateUserOrAdmin>("create-user", body, "VUserCreateSchema");

    const existingUser = await getSingleRecordByAColumnValue<User>(users, "email", validated.email);
    if (existingUser) {
      throw new ConflictException("User already exists with this email");
    }

    const defaultPassword = "123456";

    const newUser = await saveSingleRecord<User>(users, {
      ...validated,
      password: defaultPassword,
    });

    return sendSuccessResp(c, 201, "User created successfully", newUser);
  };
}

export default UsersController;
