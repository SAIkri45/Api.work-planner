// Build query data for pagination, search, filter, ordering
export function buildTaskQueryData(searchString, orderBy, task_status) {
    let orderByQueryData = {
        columns: ["created_at"],
        values: ["desc"],
    };
    const whereQueryData = {
        columns: [],
        values: [],
    };
    if (task_status) {
        whereQueryData.columns.push("task_status");
        whereQueryData.values.push(task_status);
    }
    if (searchString) {
        whereQueryData.columns.push("task_title");
        whereQueryData.values.push(`%${searchString}%`);
    }
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
