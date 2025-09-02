import type { InferSelectModel } from "drizzle-orm";
import type { Context } from "hono";
import type { DBTableColumns, OrderByQueryData, SortDirection, WhereQueryData } from "../types/dbTypes.js";
import { USERS_FETCHED,FAILED_TO_FETCH_USERS,EMPLOYEES_FETCHED} from "../constants/appMessages.js";
import { users } from "../db/schema/users.js";
import { getPaginatedRecordsConditionally , getRecordsConditionally} from "../services/db/baseDbService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { PgTableWithColumns, PgColumn } from "drizzle-orm/pg-core";
import BadRequestException from "../exceptions/badRequestException.js";

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
      whereQueryData,

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
      whereQueryData,
    );

    return sendSuccessResp(c, 200, EMPLOYEES_FETCHED, result);
  };
}

export default UsersController;


