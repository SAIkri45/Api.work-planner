import type { Context } from "hono";

import type { Project } from "../db/schema/project";
import type { DBTableColumns, OrderByQueryData, SortDirection, WhereQueryData } from "../types/dbTypes";

import { PROJECTS_FETCHED } from "../constants/appMessages";
import { projects } from "../db/schema/project";
import { getPaginatedRecordsConditionally } from "../services/db/baseDbService";
import { sendSuccessResp } from "../utils/respUtils";

class groupController {
  getAllProjectsPaginated = async (c: Context) => {
    const page = +c.req.query("page")! || 1;
    const pageSize = +c.req.query("page_size")! || 10;
    const searchString = c.req.query("search_string") || null;
    const orderBy = c.req.query("order_by");

    let orderByQueryData: OrderByQueryData<Project> = {
      columns: ["created_at"],
      values: ["desc"],
    };

    const WhereQueryData: WhereQueryData<Project> = {
      columns: ["deleted_at"],
      values: ["null"],
    };

    if (orderBy) {
      const orderByColumns: DBTableColumns<Project>[] = [];
      const orderByValues: SortDirection[] = [];
      const queryStrings = orderBy.split(",");
      for (const queryString of queryStrings) {
        const [column, value] = queryString.split(":");
        orderByColumns.push(column as DBTableColumns<Project>);
        orderByValues.push(value as SortDirection);
      }
      orderByQueryData = {
        columns: orderByColumns,
        values: orderByValues,
      };
    }

    if (searchString) {
      // Add search string filter using LIKE
      WhereQueryData.columns.push("title");
      WhereQueryData.values.push(`%${searchString}%`);
    }

    const result = await getPaginatedRecordsConditionally<Project>(projects, page, pageSize, orderByQueryData, WhereQueryData);

    return sendSuccessResp(c, 200, PROJECTS_FETCHED, result);
  };
}

export default groupController;
