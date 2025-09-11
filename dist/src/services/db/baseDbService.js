import { and, asc, count, desc, eq, getTableName, inArray, sql, } from "drizzle-orm";
import { db } from "../../db/configuration.js";
import { executeQuery, prepareInQueryCondition, prepareOrderByQueryConditions, prepareSelectColumnsForQuery, prepareWhereQueryConditions } from "../../utils/dbUtils.js";
// type SelectedKeys<T, K extends keyof T> = {
//   [P in K]: T[P];
// };
async function getRecordById(table, id, columnsToSelect) {
    const columnsRequired = prepareSelectColumnsForQuery(table, columnsToSelect);
    const result = columnsRequired
        ? await db.select(columnsRequired).from(table).where(eq(table.id, id))
        : await db.select().from(table).where(eq(table.id, id));
    if (result.length === 0) {
        return null;
    }
    if (columnsRequired) {
        return result[0];
        // return result[0] as SelectedKeys<R, C>
        // return result[0] as Record<C, any>
    }
    return result[0];
}
async function getRecordsConditionally(table, whereQueryData, columnsToSelect, orderByQueryData, inQueryData, trx) {
    const columnsRequired = prepareSelectColumnsForQuery(table, columnsToSelect);
    const whereConditions = prepareWhereQueryConditions(table, whereQueryData);
    const inQueryCondition = prepareInQueryCondition(table, inQueryData);
    const orderByConditions = prepareOrderByQueryConditions(table, orderByQueryData);
    const whereQuery = whereConditions ? and(...whereConditions) : null;
    const results = await executeQuery(table, whereQuery, columnsRequired, orderByConditions, inQueryCondition);
    // if (!results || results.length === 0) {
    //   return null;
    // }
    return results;
}
async function getPaginatedRecordsConditionally(table, page, pageSize, orderByQueryData, whereQueryData, columnsToSelect, inQueryData) {
    let countQuery = db
        .select({ total: count(table.id) })
        .from(table)
        .$dynamic();
    if (whereQueryData && inQueryData) {
        // Case 1: Both where and in query data exist
        const whereConditions = prepareWhereQueryConditions(table, whereQueryData);
        const inQueryCondition = prepareInQueryCondition(table, inQueryData);
        if (whereConditions && whereConditions.length > 0 && inQueryCondition) {
            // Both conditions are valid - combine them with AND
            countQuery = countQuery.where(and(and(...whereConditions), inQueryCondition));
        }
    }
    else if (whereQueryData) {
        // Case 2: Only where query data exists
        const whereConditions = prepareWhereQueryConditions(table, whereQueryData);
        if (whereConditions && whereConditions.length > 0) {
            countQuery = countQuery.where(and(...whereConditions));
        }
    }
    const recordsCount = await countQuery;
    const total_records = recordsCount[0]?.total || 0;
    const total_pages = Math.ceil(total_records / pageSize) || 1;
    const pagination_info = {
        total_records,
        total_pages,
        page_size: pageSize,
        current_page: page > total_pages ? total_pages : page,
        next_page: page >= total_pages ? null : page + 1,
        prev_page: page <= 1 ? null : page - 1,
    };
    if (total_records === 0) {
        return {
            pagination_info,
            records: [],
        };
    }
    const columnsRequired = prepareSelectColumnsForQuery(table, columnsToSelect);
    const whereConditions = prepareWhereQueryConditions(table, whereQueryData);
    const orderByConditions = prepareOrderByQueryConditions(table, orderByQueryData);
    const inQueryCondition = prepareInQueryCondition(table, inQueryData);
    const whereQuery = whereConditions ? and(...whereConditions) : null;
    const paginationData = { page, pageSize };
    const results = await executeQuery(table, whereQuery, columnsRequired, orderByConditions, inQueryCondition, paginationData);
    // if (!results || results.length === 0) {
    //   return null;
    // }
    return {
        pagination_info,
        records: results,
    };
}
async function getPaginatedRecordsConditionallywithtrx(table, page, pageSize, orderByQueryData, whereQueryData, columnsToSelect, inQueryData, trx) {
    const client = trx ?? db;
    let countQuery = client
        .select({ total: count(table.id) })
        .from(table)
        .$dynamic();
    if (whereQueryData && inQueryData) {
        const whereConditions = prepareWhereQueryConditions(table, whereQueryData);
        const inQueryCondition = prepareInQueryCondition(table, inQueryData);
        if (whereConditions && whereConditions.length > 0 && inQueryCondition) {
            countQuery = countQuery.where(and(and(...whereConditions), inQueryCondition));
        }
    }
    else if (whereQueryData) {
        const whereConditions = prepareWhereQueryConditions(table, whereQueryData);
        if (whereConditions && whereConditions.length > 0) {
            countQuery = countQuery.where(and(...whereConditions));
        }
    }
    const recordsCount = await countQuery;
    const total_records = recordsCount[0]?.total || 0;
    const total_pages = Math.ceil(total_records / pageSize) || 1;
    const pagination_info = {
        total_records,
        total_pages,
        page_size: pageSize,
        current_page: page > total_pages ? total_pages : page,
        next_page: page >= total_pages ? null : page + 1,
        prev_page: page <= 1 ? null : page - 1,
    };
    if (total_records === 0) {
        return {
            pagination_info,
            records: [],
        };
    }
    const columnsRequired = prepareSelectColumnsForQuery(table, columnsToSelect);
    const whereConditions = prepareWhereQueryConditions(table, whereQueryData);
    const orderByConditions = prepareOrderByQueryConditions(table, orderByQueryData);
    const inQueryCondition = prepareInQueryCondition(table, inQueryData);
    const whereQuery = whereConditions ? and(...whereConditions) : null;
    const paginationData = { page, pageSize };
    const results = await executeQuery(table, whereQuery, columnsRequired, orderByConditions, inQueryCondition, paginationData, trx);
    return {
        pagination_info,
        records: results,
    };
}
async function getMultipleRecordsByAColumnValue(table, column, value, columnsToSelect, orderByQueryData, inQueryData) {
    const whereQueryData = {
        columns: [column],
        values: [value],
    };
    const results = await getRecordsConditionally(table, whereQueryData, columnsToSelect, orderByQueryData, inQueryData);
    return results;
}
async function getMultipleRecordsByMultipleColumnValues(table, columns, values, columnsToSelect, orderByQueryData, inQueryData) {
    const whereQueryData = {
        columns,
        values,
    };
    const results = await getRecordsConditionally(table, whereQueryData, columnsToSelect, orderByQueryData, inQueryData);
    // if (!results) {
    //   return null;
    // }
    return results;
}
async function getSingleRecordByAColumnValue(table, column, value, columnsToSelect, orderByQueryData, inQueryData) {
    const whereQueryData = {
        columns: [column],
        values: [value],
    };
    const results = await getRecordsConditionally(table, whereQueryData, columnsToSelect, orderByQueryData, inQueryData);
    if (!results) {
        return null;
    }
    return results[0];
}
async function getSingleRecordByMultipleColumnValues(table, columns, values, columnsToSelect, orderByQueryData, inQueryData) {
    const whereQueryData = {
        columns,
        values,
    };
    const results = await getRecordsConditionally(table, whereQueryData, columnsToSelect, orderByQueryData, inQueryData);
    if (!results) {
        return null;
    }
    return results[0];
}
//with trx
async function getSingleRecordByMultipleColumnValueswithtrx(table, columns, values, trx, columnsToSelect, orderByQueryData, inQueryData) {
    const whereQueryData = {
        columns,
        values,
    };
    const results = await getRecordsConditionally(table, whereQueryData, columnsToSelect, orderByQueryData, inQueryData, trx);
    if (!results) {
        return null;
    }
    return results[0];
}
async function saveSingleRecord(table, record, trx) {
    const client = trx ?? db;
    const dataWithTimeStamps = {
        ...record,
        created_at: new Date(),
    };
    const recordSaved = await client
        .insert(table)
        .values({
        ...dataWithTimeStamps
    })
        .returning();
    return recordSaved[0];
}
async function saveRecords(table, records) {
    const recordsSaved = await db.insert(table).values(records).returning();
    return recordsSaved;
}
//with trx
async function saveRecordswithtrx(table, records, trx) {
    const client = trx ?? db; // use trx if provided, else fallback to db
    const recordsSaved = await client.insert(table).values(records).returning();
    return recordsSaved;
}
async function deleteRecordById(table, id) {
    const deletedRecord = await db
        .delete(table)
        .where(eq(table.id, id))
        .returning();
    return deletedRecord[0];
}
async function exportData(table, projection, filters) {
    const initialQuery = db.select(projection).from(table);
    let finalQuery;
    if (filters && filters.length > 0) {
        finalQuery = initialQuery.where(and(...filters));
    }
    const result = await finalQuery;
    return result;
}
async function getPaginatedRecords(table, skip, limit, filters, sorting, projection) {
    let initialQuery = db.select(projection).from(table);
    if (filters && filters.length > 0) {
        initialQuery = initialQuery.where(and(...filters));
    }
    if (sorting) {
        const columnExpression = table[sorting.sort_by];
        if (sorting.sort_type === "asc") {
            initialQuery = initialQuery.orderBy(asc(columnExpression));
        }
        else {
            initialQuery = initialQuery.orderBy(desc(columnExpression));
        }
    }
    else {
        initialQuery = initialQuery.orderBy(desc(table.created_at));
    }
    const result = await initialQuery.limit(limit).offset(skip);
    return result;
}
//without trx
async function getRecordsCount(table, filters) {
    let initialQuery = db.select({ total: count() }).from(table);
    let finalQuery;
    if (filters && filters.length > 0) {
        finalQuery = initialQuery.where(and(...filters));
    }
    else {
        finalQuery = initialQuery;
    }
    const result = await finalQuery;
    return result[0]?.total ?? 0;
}
//with trx
async function getRecordsCountwithtrx(table, filters, trx) {
    const dbInstance = trx ?? db;
    let initialQuery = dbInstance.select({ total: count() }).from(table);
    let finalQuery;
    if (filters && filters.length > 0) {
        finalQuery = initialQuery.where(and(...filters));
    }
    else {
        finalQuery = initialQuery;
    }
    const result = await finalQuery;
    return result[0]?.total ?? 0;
}
async function updateRecordByColumnValue(table, column, value, record, id) {
    const dataWithTimeStamps = { id, ...record, updated_at: new Date() };
    const columnInfo = sql.raw(`${getTableName(table)}.${column}`);
    return await db
        .update(table)
        .set(dataWithTimeStamps)
        .where(eq(columnInfo, value));
}
//with trx
async function updateRecordByColumnValuewithtrx(table, column, value, record, trx, extraCondition) {
    const client = trx ?? db;
    const dataWithTimeStamps = {
        ...record,
        updated_at: new Date(),
    };
    const conditions = [eq(table[column], value)];
    if (extraCondition) {
        if (extraCondition.operator === "IN") {
            conditions.push(inArray(table[extraCondition.column], extraCondition.value));
        }
        else {
            conditions.push(eq(table[extraCondition.column], extraCondition.value));
        }
    }
    const [updatedRecord] = await client
        .update(table)
        .set(dataWithTimeStamps)
        .where(and(...conditions))
        .returning();
    return updatedRecord;
}
async function updateRecordById(table, id, record, trx) {
    const client = trx ?? db;
    const dataWithTimeStamps = {
        id,
        ...record,
        updated_at: new Date(),
    };
    const recordUpdated = await client
        .update(table)
        .set(dataWithTimeStamps)
        .where(eq(table.id, id))
        .returning();
    return recordUpdated[0];
}
//withtrx
async function updateRecordByIdwithtrx(table, id, record, trx) {
    const client = trx ?? db; // Use transaction if provided, else fallback to db
    const dataWithTimeStamps = {
        ...record,
        updated_at: new Date(),
    };
    const result = await client
        .update(table)
        .set(dataWithTimeStamps)
        .where(eq(table.id, id))
        .returning();
    return result.length > 0 ? result[0] : null;
}
async function updateRecordByMultipleColumnValues(table, columns, values, record, id, trx) {
    const client = trx ?? db;
    const dataWithTimeStamps = { id, ...record, updated_at: new Date() };
    // ✅ Build conditions with IN support
    const whereConditions = columns.map((column, index) => {
        const value = values[index];
        if (Array.isArray(value)) {
            // If value is an array → use IN condition
            return inArray(table[column], value);
        }
        // Otherwise → normal equality
        return eq(table[column], value);
    });
    return await client
        .update(table)
        .set(dataWithTimeStamps)
        .where(and(...whereConditions))
        .returning(); // return updated rows
}
async function updateMultipleRecordsByIds(table, ids, record) {
    const updatedRecords = await db
        .update(table)
        .set(record)
        .where(inArray(table.id, ids))
        .returning();
    return updatedRecords.length;
}
async function deleteRecordsByColumn(table, column, value) {
    return await db.delete(table).where(eq(table[column], value));
}
// ../services/db/baseDbService.ts
async function softDeleteRecordById(table, id, record) {
    return await db.update(table).set(record).where(eq(table.id, id)).returning();
}
export { deleteRecordById, deleteRecordsByColumn, exportData, getMultipleRecordsByAColumnValue, getMultipleRecordsByMultipleColumnValues, getPaginatedRecords, getPaginatedRecordsConditionally, getPaginatedRecordsConditionallywithtrx, getSingleRecordByMultipleColumnValueswithtrx, getRecordById, getRecordsConditionally, getRecordsCount, getRecordsCountwithtrx, getSingleRecordByAColumnValue, getSingleRecordByMultipleColumnValues, saveRecords, saveRecordswithtrx, saveSingleRecord, softDeleteRecordById, updateMultipleRecordsByIds, updateRecordByColumnValue, updateRecordByColumnValuewithtrx, updateRecordById, updateRecordByIdwithtrx, updateRecordByMultipleColumnValues, };
