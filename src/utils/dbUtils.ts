import type { SQL } from "drizzle-orm";

import { and, eq, getTableName, inArray, isNull, ne, sql } from "drizzle-orm";

import type { DBTable, DBTableRow, InQueryData, OrderByQueryData, WhereQueryData } from "../types/dbTypes.js";

import { db } from "../db/configuration.js";

function prepareSelectColumnsForQuery(table: DBTable, columnsToSelect?: any) {
  if (!columnsToSelect) {
    return null;
  }

  if (columnsToSelect.length === 0) {
    return {};
  }

  const columnsForQuery: Record<string, SQL> = {};
  // loop through columns and prepare the select query object
  columnsToSelect.map((column: string) => {
    return (columnsForQuery[column as string] = sql.raw(
      `${getTableName(table)}.${column as string}`,
    ));
  });
  return columnsForQuery;
}



function prepareWhereQueryConditions<R extends DBTableRow>(
  table: DBTable,
  whereQueryData?: WhereQueryData<R>,
) {
  if (
    whereQueryData
    && Object.keys(whereQueryData).length > 0
    && whereQueryData.columns.length > 0
  ) {
    const { columns, values, relations } = whereQueryData;
    const whereQueries: SQL[] = [];
    const orConditions: SQL[] = [];

    for (let i = 0; i < columns.length; i++) {
      const columnInfo = sql.raw(`${getTableName(table)}.${columns[i] as string}`);
      const value = values[i];
      const relation = relations?.[i] || "eq";

      // Handle LIKE / ILIKE for strings containing '%'
      if (typeof value === "string" && value.includes("%")) {
        // Example: custom OR conditions for certain columns
        if (["shape", "color", "cut", "clarity", "polish", "symmetry", "rep_no", "carat"].includes(columns[i] as string)) {
          orConditions.push(sql`${columnInfo} ILIKE ${value}`);
        }
        else {
          whereQueries.push(sql`${columnInfo} ILIKE ${value}`);
        }
      }
      // Handle deleted_at IS NULL
      else if (columns[i] === "deleted_at" && value === null) {
        whereQueries.push(isNull(columnInfo));
      }
      // Handle range objects: { gte, lte }
      else if (typeof value === "object" && value !== null && ("gte" in value || "lte" in value)) {
        const range = value as { gte?: Date | string; lte?: Date | string };
        if (range.gte && range.lte) {
          whereQueries.push(sql`${columnInfo} BETWEEN ${range.gte} AND ${range.lte}`);
        }
        else if (range.gte) {
          whereQueries.push(sql`${columnInfo} >= ${range.gte}`);
        }
        else if (range.lte) {
          whereQueries.push(sql`${columnInfo} <= ${range.lte}`);
        }
      }
      // Handle eq / ne / like explicitly
      else {
        if (relation === "ne") {
          whereQueries.push(ne(columnInfo, value));
        }
        else if (relation === "eq") {
          whereQueries.push(eq(columnInfo, value));
        }
        else if (relation === "like") {
          whereQueries.push(sql`${columnInfo} ILIKE ${value}`);
        }
      }
    }

    // Combine OR conditions if any
    if (orConditions.length > 0) {
      whereQueries.push(sql`(${sql.join(orConditions, sql` OR `)})`);
    }

    return whereQueries;
  }

  return null;
}

function prepareOrderByQueryConditions<R extends DBTableRow>(
  table: DBTable,
  orderByQueryData?: OrderByQueryData<R>,
) {
  const orderByQueries: SQL[] = [];

  if (
    !orderByQueryData
    || Object.keys(orderByQueryData).length === 0
    || orderByQueryData.columns.length === 0
  ) {
    const orderByQuery = sql.raw(`${getTableName(table)}.id desc`);
    orderByQueries.push(orderByQuery);
  }

  if (
    orderByQueryData
    && Object.keys(orderByQueryData).length > 0
    && orderByQueryData.columns.length > 0
  ) {
    const { columns, values } = orderByQueryData;
    for (let i = 0; i < columns.length; i++) {
      const orderByQuery = sql.raw(
        `${getTableName(table)}.${columns[i] as string} ${values[i] as string}`,
      );
      orderByQueries.push(orderByQuery);
    }
  }
  return orderByQueries;
}

function prepareInQueryCondition<R extends DBTableRow>(
  table: DBTable,
  inQueryData?: InQueryData<R>,
) {
  if (
    inQueryData
    && Object.keys(inQueryData).length > 0
    && inQueryData.values.length > 0
  ) {
    const columnInfo = sql.raw(
      `${getTableName(table)}.${inQueryData.key as string}`,
    );
    const inQuery = inArray(columnInfo, inQueryData.values);
    return inQuery;
  }
  return null;
}

async function executeQuery<R extends DBTableRow, C extends keyof R = keyof R>(
  table: DBTable,
  whereQuery: SQL | undefined | null,
  columnsRequired: Record<string, SQL> | null,
  orderByConditions: SQL[],
  inQueryCondition: SQL | null,
  paginationData?: { page: number; pageSize: number },

) {
  let dQuery = columnsRequired
    ? db.select(columnsRequired).from(table).$dynamic()
    : db.select().from(table).$dynamic();

  if (whereQuery && inQueryCondition) {
    dQuery = dQuery.where(and(whereQuery, inQueryCondition));
  }
  else if (whereQuery) {
    dQuery = dQuery.where(whereQuery);
  }
  else if (inQueryCondition) {
    dQuery = dQuery.where(inQueryCondition);
  }

  dQuery = dQuery.orderBy(...orderByConditions);

  if (paginationData) {
    const { page, pageSize } = paginationData;
    dQuery = dQuery.limit(pageSize).offset((page - 1) * pageSize);
  }


  const results = await dQuery;

  if (columnsRequired) {
    return results as Pick<R, C>[];
  }
  return results as R[];
}

export {
  executeQuery,
  prepareInQueryCondition,
  prepareOrderByQueryConditions,
  prepareSelectColumnsForQuery,
  prepareWhereQueryConditions,
};
