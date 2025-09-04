import { desc, eq, ilike, isNull, sql } from "drizzle-orm";

import type { ProjectUser, ProjectWithUsersResponse } from "../types/appTypes";

import { allowedProjectStatus } from "../constants/appMessages";
import { projects } from "../db/schema/projects";

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
        userId: userProject.users.id,
        displayName: userProject.users.display_name,
      })),
  }));
}
