import type { db } from "../db/configuration.js";
import type { NewProject, Project, ProjectsTable } from "../db/schema/projects.js";
import type { NewSlackToken, SlackToken, SlackTokensTable } from "../db/schema/slackTokens.js";
import type { NewTask, Task, TasksTable } from "../db/schema/tasks.js";
import type { NewUserProjects, UserProjects, UserProjectsTable } from "../db/schema/userProjects.js";
import type { NewUser, User, UsersTable } from "../db/schema/users.js";

export type DBTable = UsersTable | SlackTokensTable | TasksTable | ProjectsTable | UserProjectsTable;
export type DBTableRow = User | SlackToken | Task | Project | UserProjects;
export type DBNewRecord = NewUser | NewSlackToken | NewTask | NewProject | NewUserProjects;
export type DBNewRecords = NewUser[] | NewSlackToken[] | NewTask[] | NewProject[] | NewUserProjects[];

export type DBTableColumns<T extends DBTableRow> = keyof T;
export type SortDirection = "asc" | "desc";
export interface WhereQueryData<T extends DBTableRow> {
  columns: Array<keyof T>;
  values: any[];
  relations?: Array<"eq" | "ne">;
}

// export interface WhereQueryData<T extends DBTableRow> {
//   columns: Array<keyof T>;
//   values: any[];
//   relations?: Array<"=" | ">" | "<" | ">=" | "<=" | "LIKE" | "ILIKE" | "IN" | "BETWEEN" | "IS NULL" | "!=" | "contains" | "@>">;
// }

export interface OrderByQueryData<T extends DBTableRow> {
  columns: Array<DBTableColumns<T>>;
  values: SortDirection[];
}

export interface InQueryData<T extends DBTableRow> {
  key: keyof T;
  values: any[];
}

export type UpdateRecordData<R extends DBTableRow> = Partial<
  Omit<R, "id" | "created_at" | "updated_at">
>;

export interface PaginationInfo {
  total_records: number;
  total_pages: number;
  page_size: number;
  current_page: number;
  next_page: number | null;
  prev_page: number | null;
}

export interface PaginatedRecords<T extends DBTableRow> {
  pagination_info: PaginationInfo;
  records: T[];
}

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
