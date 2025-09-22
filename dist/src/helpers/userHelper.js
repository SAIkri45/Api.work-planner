import { desc, isNull, sql } from "drizzle-orm";
import { projects } from "../db/schema/projects.js";
/**
 * Build query data for pagination, search, filter, ordering (Users)
 */
export function buildUserQueryData(searchString, orderBy, user_status) {
    // Default ordering
    let orderByQueryData = {
        columns: ["created_at"],
        values: ["desc"],
    };
    // Default filtering
    const whereQueryData = {
        columns: [],
        values: [],
    };
    // Filter by status
    if (user_status) {
        whereQueryData.columns.push("user_status");
        whereQueryData.values.push(user_status);
    }
    // Search filter (searching by user_name or email)
    if (searchString) {
        // You can adjust this to search multiple columns if needed
        whereQueryData.columns.push("user_name");
        whereQueryData.values.push(`%${searchString}%`);
    }
    // Order by columns
    if (orderBy) {
        const orderByColumns = [];
        const orderByValues = [];
        const queryStrings = orderBy.split(",");
        for (const queryString of queryStrings) {
            const [column, value] = queryString.split(":");
            orderByColumns.push(column);
            orderByValues.push(value);
        }
        orderByQueryData = {
            columns: orderByColumns,
            values: orderByValues,
        };
    }
    return { orderByQueryData, whereQueryData };
}
export async function buildFiltersRemovedUserProjects(search) {
    const filters = [isNull(projects.deleted_at)];
    if (search?.trim()) {
        filters.push(sql `LOWER(${projects.title}) LIKE LOWER(${`%${search.trim()}%`})`);
    }
    return filters;
}
export function buildOrderByClauseRemovedUserProjects(orderBy) {
    if (!orderBy) {
        return desc(projects.created_at);
    }
    const [column, direction] = orderBy.split(":");
    const dir = direction?.toLowerCase() === "desc" ? "desc" : "asc";
    return dir === "desc"
        ? sql `${sql.identifier(column)} DESC`
        : sql `${sql.identifier(column)} ASC`;
}
