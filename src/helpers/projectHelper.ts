import { desc, eq, ilike, isNull, sql } from "drizzle-orm";

import type { Project } from "../db/schema/projects.js";
import type { User } from "../db/schema/users.js";
import type { ProjectUser, ProjectWithUsersResponse } from "../types/appTypes.js";
import type { WhereQueryData } from "../types/dbTypes.js";

import { allowedProjectStatus } from "../constants/appMessages.js";
import { projects } from "../db/schema/projects.js";

// filters
export function buildProjectFilters(search?: string, projectStatus?: any): any[] {
  const filters: any[] = [isNull(projects.deleted_at)];

  if (search?.trim()) {
    filters.push(ilike(projects.title, `%${search.trim()}%`));
  }

  if (projectStatus && allowedProjectStatus.includes(projectStatus.toUpperCase())) {
    filters.push(eq(projects.project_status, projectStatus.toUpperCase() as any));
  }

  return filters;
}

// projects orderby
export function buildOrderByClause(orderBy?: string): any {
  if (!orderBy) {
    return desc(projects.created_at);
  }

  const [column, direction] = orderBy.split(":");
  const dir = direction?.toLowerCase() === "desc" ? "desc" : "asc";

  return dir === "desc"
    ? sql`${sql.identifier(column)} DESC`
    : sql`${sql.identifier(column)} ASC`;
}

// projects with users
export function mapProjectsWithUsers(projects: any[]): ProjectWithUsersResponse[] {
  return projects.map((project: any) => ({
    projectId: project.id,
    projectName: project.title,
    project_start_date: project.start_date,
    project_end_date: project.end_date,
    projectLogoUrl: project.logo_url,
    projectStatus: project.project_status,
    users: project.userProjects
      .filter((userProject: any) => userProject.users)
      .map((userProject: any): ProjectUser => ({
        user_id: userProject.users.id,
        display_name: userProject.users.display_name,
      })),
  }));
}

export function buildProjectsWhereQueryData(
  startDate: string | null,
  endDate: string | null,
  projectStatus: string | null,
  searchString: string | null,
  user: User,
) {
  const whereQueryData: WhereQueryData<Project> = {
    columns: ["deleted_at"],
    values: [null],
  };

  // Search string filter
  if (searchString) {
    whereQueryData.columns.push("title");
    whereQueryData.values.push(`%${searchString}%`);
  }

  // Project status filter
  if (projectStatus) {
    whereQueryData.columns.push("project_status");
    whereQueryData.values.push(projectStatus);
  }

  // Date range filter
  if (startDate || endDate) {
    whereQueryData.columns.push("due_date");
    const dateFilter: { gte?: Date; lte?: Date } = {};

    if (startDate) {
      dateFilter.gte = new Date(`${startDate}T00:00:00`);
    }
    if (endDate) {
      dateFilter.lte = new Date(`${endDate}T23:59:59`);
    }
    whereQueryData.values.push(dateFilter);
  }

  // User-based filtering based on role
  if (user.user_type === "EMPLOYEE" || user.user_type === "TL" || user.user_type === "MANAGER") {
    // Employees and Team Leaders can only see projects they're assigned to
    // This assumes you have a user_projects junction table or similar
    whereQueryData.columns.push("created_by");
    whereQueryData.values.push(user.id);
  }
  // ADMIN, MANAGER, SUPER_ADMIN can see all projects (no additional filtering)

  return whereQueryData;
}
