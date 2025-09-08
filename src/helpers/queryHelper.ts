import { DBTableColumns } from "../types/dbTypes";
import { OrderByQueryData, SortDirection, WhereQueryData } from "../types/dbTypes";
import { Task } from "../db/schema/tasks" ;

// Build query data for pagination, search, filter, ordering
export function buildTaskQueryData(
  searchString: string | null,
  orderBy: string | null,
  task_status: string | null
): {
  orderByQueryData: OrderByQueryData<Task>;
  whereQueryData: WhereQueryData<Task>;
} {
  let orderByQueryData: OrderByQueryData<Task> = {
    columns: ["created_at"],
    values: ["desc"],
  };

  const whereQueryData: WhereQueryData<Task> = {
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
    const orderByColumns: DBTableColumns<Task>[] = [];
    const orderByValues: SortDirection[] = [];
    const queryStrings = orderBy.split(",");
    for (const queryString of queryStrings) {
      const [column, value] = queryString.split(":");
      orderByColumns.push(column as DBTableColumns<Task>);
      orderByValues.push(value as SortDirection);
    }
    orderByQueryData = {
      columns: orderByColumns,
      values: orderByValues,
    };
  }

  return { orderByQueryData, whereQueryData };
}
