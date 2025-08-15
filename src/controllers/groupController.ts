import type { Context } from "hono";

import type { Group } from "../db/schema/group.js";
import type { DBTableColumns, OrderByQueryData, SortDirection, WhereQueryData } from "../types/dbTypes.js";
import type { ValidatedCreateGroup } from "../validations/schemas/vGroupSchema.js";

import { GROUP_CREATED, GROUP_VALIDATION_ERROR, GROUPS_FETCHED, INVALID_INPUT } from "../constants/appMessages.js";
import { groups } from "../db/schema/group.js";
import BadRequestException from "../exceptions/badRequestException.js";
import { getPaginatedRecordsConditionally, saveSingleRecord } from "../services/db/baseDbService.js";
import { sendSuccessResp } from "../utils/respUtils.js";
import { validateRequest } from "../validations/validateRequest.js";

class GroupController {
  createGroup = async (c: Context) => {
    const req = await c.req.json();
    const user = c.get("userDetails");

    if (!user) {
      throw new BadRequestException(INVALID_INPUT);
    }

    const validatedGroup = await validateRequest<ValidatedCreateGroup>("add-group", req, GROUP_VALIDATION_ERROR);

    const saveGroup = await saveSingleRecord<Group>(groups, { ...validatedGroup, created_by: user.id });

    return sendSuccessResp(c, 200, GROUP_CREATED, saveGroup);
  };

  getAllGroupsPaginated = async (c: Context) => {
    const page = c.req.query("page")! || 1;
    const pageSize = c.req.query("page_size")! || 10;
    const searchString = c.req.query("search_string") || null;
    const orderBy = c.req.query("order_by");

    let orderByQueryData: OrderByQueryData<Group> = {
      columns: ["created_at"],
      values: ["desc"],
    };

    const whereQueryData: WhereQueryData<Group> = {
      columns: ["deleted_at"],
      values: [null],
    };

    if (orderBy) {
      const orderByColumns: DBTableColumns<Group>[] = [];
      const orderByValues: SortDirection[] = [];
      const queryStrings = orderBy.split(",");
      for (const queryString of queryStrings) {
        const [column, value] = queryString.split(":");
        orderByColumns.push(column as DBTableColumns<Group>);
        orderByValues.push(value as SortDirection);
      }
      orderByQueryData = {
        columns: orderByColumns,
        values: orderByValues,
      };
    }

    if (searchString) {
      // Add search string filter using LIKE
      whereQueryData.columns.push("title");
      whereQueryData.values.push(`%${searchString}%`);
    }

    const resp = await getPaginatedRecordsConditionally<Group>(groups, +page, +pageSize, orderByQueryData, whereQueryData);

    return sendSuccessResp(c, 200, GROUPS_FETCHED, resp);
  };
}

export default GroupController;
