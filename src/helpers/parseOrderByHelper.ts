import type { DBTableColumns, DBTableRow, OrderByQueryData, SortDirection } from "../types/dbTypes.js";

export function parseOrderByQuery<T extends DBTableRow>(
  orderBy: string | undefined,
  defaultColumn: DBTableColumns<T> = "created_at" as DBTableColumns<T>,
  defaultDirection: SortDirection = "desc",
): OrderByQueryData<T> {
  // Default orderBy configuration
  let orderByQueryData: OrderByQueryData<T> = {
    columns: [defaultColumn],
    values: [defaultDirection],
  };
  if (orderBy) {
    const orderByColumns: DBTableColumns<T>[] = [];
    const orderByValues: SortDirection[] = [];

    // Split by comma for multiple ordering criteria
    const queryStrings = orderBy.split(",");

    // Process each ordering criterion
    queryStrings.forEach((queryString) => {
      const [column, value] = queryString.split(":");
      orderByColumns.push(column as DBTableColumns<T>);
      orderByValues.push(value as SortDirection);
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
