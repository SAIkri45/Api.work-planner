import type { User } from "../db/schema/users";
import type { DBTableColumns, OrderByQueryData, SortDirection, WhereQueryData } from "../types/dbTypes";

/**
 * Build query data for pagination, search, filter, ordering (Users)
 */
export function buildUserQueryData(
  searchString: string | null,
  orderBy: string | null,
  user_status: string | null,
): {
  orderByQueryData: OrderByQueryData<User>;
  whereQueryData: WhereQueryData<User>;
} {
  // Default ordering
  let orderByQueryData: OrderByQueryData<User> = {
    columns: ["created_at"],
    values: ["desc"],
  };

  // Default filtering
  const whereQueryData: WhereQueryData<User> = {
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

  return { orderByQueryData, whereQueryData };
}
