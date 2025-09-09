import type { InferSelectModel } from "drizzle-orm";
import type { Context } from "hono";
import type {
  DBTableColumns,
  OrderByQueryData,
  SortDirection,
  WhereQueryData,
} from "../types/dbTypes.js";
import {
  USERS_FETCHED,
  FAILED_TO_FETCH_USERS,
  EMPLOYEES_FETCHED,
  USER_VALIDATION_ERROR,
  USER_NOT_FOUND,
  USER_FETCHED,
  FAILED_TO_UPDATE_USER,
} from "../constants/appMessages.js";
import { users } from "../db/schema/users.js";
import {
  getPaginatedRecordsConditionally,
  getRecordsConditionally,
  getSingleRecordByMultipleColumnValues,
  updateRecordById,
} from "../services/db/baseDbService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { PgTableWithColumns, PgColumn } from "drizzle-orm/pg-core";
import BadRequestException from "../exceptions/badRequestException.js";
import { validateRequest } from "../validations/validateRequest.js";
import conflictException from "../exceptions/conflictException.js";
import {
  USER_ALREADY_EXISTS,
  USER_CREATED,
  USER_UPDATED,
} from "../constants/appMessages.js";
import { saveSingleRecord } from "../services/db/baseDbService.js";
import type { ValidatedCreateUserOrAdmin } from "../validations/schemas/vUserSchema.js";
import { VCreateUserSchema } from "../validations/schemas/vUserSchema.js";
import { parseAsync } from "valibot";

import NotFoundException from "./../exceptions/notFoundException";

type User = InferSelectModel<typeof users>;

export class UsersController {
  // 1. Get paginated users
  getPaginatedUsers = async (c: Context) => {
    const page = +c.req.query("page")! || 1;
    const pageSize = +c.req.query("page_size")! || 10;
    const searchString = c.req.query("search_string")?.trim() || null;
    const orderBy = c.req.query("order_by");
    const userType = c.req.query("user_type");

    let orderByQueryData: OrderByQueryData<User> = {
      columns: ["created_at"],
      values: ["desc"],
    };

    const whereQueryData: WhereQueryData<User> = {
      columns: ["user_status"],
      values: ["ACTIVE"],
    };
    if (userType) {
      whereQueryData.columns.push("user_type");
      whereQueryData.values.push(userType);
    }

    if (orderBy) {
      const orderByColumns: DBTableColumns<User>[] = [];
      const orderByValues: SortDirection[] = [];
      const queryStrings = orderBy.split(",");
      for (const queryString of queryStrings) {
        const [column, value] = queryString.split(":");
        orderByColumns.push(column as DBTableColumns<User>);
        orderByValues.push(value as SortDirection);
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

    const result = await getPaginatedRecordsConditionally<User>(
      users,
      page,
      pageSize,
      orderByQueryData,
      whereQueryData
    );

    return sendSuccessResp(c, 200, USERS_FETCHED, result);
  };

  // 2. Dropdown list (id + full_name only)
  getUsersDropdown = async (c: Context) => {
    try {
      const searchString = c.req.query("search_string")?.trim() || null;

      const whereQueryData: WhereQueryData<User> = {
        columns: ["user_status"],
        values: ["ACTIVE"],
      };
      if (searchString) {
        whereQueryData.columns.push("display_name");
        whereQueryData.values.push(`%${searchString}%`);
      }

      const result = await getRecordsConditionally<User>(
        users,
        whereQueryData,
        ["id", "display_name"],
        { columns: ["created_at"], values: ["asc"] }
      );

      return sendSuccessResp(c, 200, USERS_FETCHED, result);
    } catch (err) {
      throw new BadRequestException(FAILED_TO_FETCH_USERS);
    }
  };

  // 3. Employees list (exclude admins) with pagination
  getEmployeesList = async (c: Context) => {
    const page = +c.req.query("page")! || 1;
    const pageSize = +c.req.query("page_size")! || 10;
    const searchString = c.req.query("search_string")?.trim() || null;

    const whereQueryData: WhereQueryData<User> = {
      columns: ["user_type"],
      values: ["EMPLOYEE"],
    };

    if (searchString) {
      whereQueryData.columns.push("display_name");
      whereQueryData.values.push(`%${searchString}%`);
    }

    const result = await getPaginatedRecordsConditionally<User>(
      users,
      page,
      pageSize,
      { columns: ["created_at"], values: ["desc"] },
      whereQueryData
    );

    return sendSuccessResp(c, 200, EMPLOYEES_FETCHED, result);
  };
  //Add user
  addUser = async (c: Context) => {
    const requestBody = await c.req.json();

    const validatedReq = await validateRequest<ValidatedCreateUserOrAdmin>(
      "create-user",
      requestBody,
      USER_VALIDATION_ERROR
    );

    const columnsToSelect = [
      "id",
      "name",
      "email",
      "phone",
      "deleted_at",
    ] as const;

    const existingUser = await getSingleRecordByMultipleColumnValues(
      users,
      ["email", "phone"],
      [validatedReq.email, validatedReq.phone],
      columnsToSelect
    );

    if (existingUser) {
      throw new conflictException(USER_ALREADY_EXISTS);
    }

    const now = new Date();

    const savedUser = await saveSingleRecord(users, {
      ...validatedReq,
      created_at: now,
      updated_at: now,
    });

    return sendSuccessResp(c, 200, USER_CREATED, savedUser);
  };

  // get single user by id
  getUserById = async (c: Context) => {
    const userId = Number(c.req.param("id"));

    const user = await getSingleRecordByMultipleColumnValues<User>(
      users,
      ["id", "deleted_at"],
      [userId, null]
    );

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

    const existingUser = await getSingleRecordByMultipleColumnValues<User>(
      users,
      ["id", "deleted_at"],
      [userId, null]
    );

    if (!existingUser) {
      throw new NotFoundException(USER_NOT_FOUND);
    }

    
    const validatedReq = await parseAsync(VCreateUserSchema, requestBody);

    await updateRecordById<User>(users, userId, validatedReq);

    const updatedUser = await getSingleRecordByMultipleColumnValues<User>(
      users,
      ["id", "deleted_at"],
      [userId, null]
    );

    return sendSuccessResp(c, 200, USER_UPDATED, updatedUser);
  } catch (err) {
    throw new BadRequestException(FAILED_TO_UPDATE_USER);
  }
};

}

export default UsersController;
