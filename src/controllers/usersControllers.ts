import type { InferSelectModel } from "drizzle-orm";
import type { Context } from "hono";

import { parseAsync } from "valibot";

import type {
  DBTableColumns,
  OrderByQueryData,
  SortDirection,
  WhereQueryData,
} from "../types/dbTypes.js";
import type { ValidatedCreateUserOrAdmin, ValidatedUpdateUser } from "../validations/schemas/vUserSchema.js";

import {
  EMPLOYEES_FETCHED,
  FAILED_TO_UPDATE_USER,
  INVALID_INPUT,
  USER_FETCHED,
  USER_NOT_FOUND,
  USER_UPDATED,
  USERS_FETCHED,
} from "../constants/appMessages.js";
import { users } from "../db/schema/users.js";
import BadRequestException from "../exceptions/badRequestException.js";
import ConflictException from "../exceptions/conflictException.js";
import { parseOrderByQuery } from "../helpers/parseOrderByHelper.js";
import {
  getPaginatedRecordsConditionally,
  getRecordById,
  getRecordsConditionally,
  getSingleRecordByAColumnValue,
  getSingleRecordByMultipleColumnValues,
  saveSingleRecord,
  updateRecordById,
} from "../services/db/baseDbService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { VCreateUserSchema } from "../validations/schemas/vUserSchema.js";
import { validateRequest } from "../validations/validateRequest.js";
import NotFoundException from "./../exceptions/notFoundException.js";

type User = InferSelectModel<typeof users>;

export class UsersController {
  // 1. Get paginated users
  // getPaginatedUsers = async (c: Context) => {
  //   try {
  //     const page = +(c.req.query("page") || 1);
  //     const pageSize = +(c.req.query("page_size") || 10);
  //     const searchString = c.req.query("search_string")?.trim() || null;
  //     const orderBy = c.req.query("order_by");
  //     const userType = c.req.query("user_type");

  //     // Default filters
  //     const filters: Partial<User> = {
  //       user_status: "ACTIVE",
  //     };
  //     if (userType)
  //       filters.user_type = userType as any;

  //     // Build query data using your helper
  //     const { orderByQueryData, whereQueryData } = buildUserQueryData(
  //       searchString,
  //       orderBy ?? null,
  //       filters,
  //       "display_name", // default search column
  //     );

  //     // Fetch paginated users
  //     const result = await getPaginatedRecordsConditionally<User>(
  //       users,
  //       page,
  //       pageSize,
  //       orderByQueryData as any,
  //       whereQueryData as any,
  //     );

  //     return sendSuccessResp(c, 200, USERS_FETCHED, result);
  //   }
  //   catch (err) {
  //     console.error("Error fetching paginated users:", err);
  //     return c.json({ message: "Failed to fetch users" }, 500);
  //   }
  // };

  getPaginatedUsers = async (c: Context) => {
    const page = +c.req.query("page")! || 1;
    const pageSize = +c.req.query("page_size")! || 10;
    const searchString = c.req.query("search_string") || null;
    const orderBy = c.req.query("order_by");
    const userType = c.req.query("user_type");

    let orderByQueryData: OrderByQueryData<User> = {
      columns: ["created_at"],
      values: ["desc"],
    };

    const whereQueryData: WhereQueryData<User> = {
      columns: ["user_status", "deleted_at"],
      values: ["ACTIVE", null],
    };

    // Parse order by query
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

    if (userType) {
      whereQueryData.columns.push("user_type");
      whereQueryData.values.push(userType);
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
      whereQueryData,
    );

    return sendSuccessResp(c, 200, USERS_FETCHED, result);
  };

  // 2. Dropdown list (id + full_name only)
  getUsersDropdown = async (c: Context) => {
    const searchString = c.req.query("search_string");

    const orderByQueryData = parseOrderByQuery<User>("id", "asc");

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
      whereQueryData,
    );

    return sendSuccessResp(c, 200, EMPLOYEES_FETCHED, result);
  };

  // Add user
  updateInternalUser = async (c: Context) => {
    const id = +c.req.param("id");
    const req = await c.req.json();

    if (!id) {
      throw new BadRequestException(INVALID_INPUT);
    }

    const user = await getRecordById<User>(users, id);
    if (!user || user.deleted_at !== null || user.user_status !== "ACTIVE") {
      throw new NotFoundException(USER_NOT_FOUND);
    }

    const validatedUser: ValidatedUpdateUser = await validateRequest(
      "update-user",
      req,
      "VUpdateUserSchema",
    );

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

    const user = await getSingleRecordByMultipleColumnValues<User>(
      users,
      ["id", "deleted_at"],
      [userId, null],
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
        [userId, null],
      );

      if (!existingUser) {
        throw new NotFoundException(USER_NOT_FOUND);
      }

      const validatedReq = await parseAsync(VCreateUserSchema, requestBody);

      await updateRecordById<User>(users, userId, validatedReq);

      const updatedUser = await getSingleRecordByMultipleColumnValues<User>(
        users,
        ["id", "deleted_at"],
        [userId, null],
      );

      return sendSuccessResp(c, 200, USER_UPDATED, updatedUser);
    }
    catch (err) {
      throw new BadRequestException(FAILED_TO_UPDATE_USER);
    }
  };

  // create user
  addUser = async (c: Context) => {
    const body = await c.req.json();

    const validated = await validateRequest<ValidatedCreateUserOrAdmin>(
      "create-user",
      body,
      "VUserCreateSchema",
    );

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
