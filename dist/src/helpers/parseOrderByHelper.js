export function parseOrderByQuery(orderBy, defaultColumn = "created_at", defaultDirection = "desc") {
    // Default orderBy configuration
    let orderByQueryData = {
        columns: [defaultColumn],
        values: [defaultDirection],
    };
    if (orderBy) {
        const orderByColumns = [];
        const orderByValues = [];
        // Split by comma for multiple ordering criteria
        const queryStrings = orderBy.split(",");
        // Process each ordering criterion
        queryStrings.forEach((queryString) => {
            const [column, value] = queryString.split(":");
            orderByColumns.push(column);
            orderByValues.push(value);
        });
        // Update the orderByQueryData with parsed values
        orderByQueryData = {
            columns: orderByColumns,
            values: orderByValues,
        };
    }
    return orderByQueryData;
}
/**
 * Helper to prepare ORDER BY query conditions for contacts.
 */
