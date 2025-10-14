import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { allowedProjectStatus } from "../constants/appMessages.js";
import { db } from "../db/configuration.js";
import { projects } from "../db/schema/projects.js";
import { user_projects } from "../db/schema/userProjects.js";
// filters
export async function buildProjectFilters(search, projectStatus, user) {
    const filters = [isNull(projects.deleted_at)];
    if (search?.trim()) {
        filters.push(sql `LOWER(${projects.title}) LIKE LOWER(${`%${search.trim()}%`})`);
    }
    if (projectStatus && allowedProjectStatus.includes(projectStatus.toUpperCase())) {
        filters.push(eq(projects.project_status, projectStatus.toUpperCase()));
    }
    if (user.user_type === "EMPLOYEE") {
        const projectIds = await getUserAssignedProjectIds(user.id);
        if (projectIds.length === 0) {
            // Return impossible condition (always false)
            return [sql `1 = 0`];
        }
        filters.push(inArray(projects.id, projectIds));
    }
    return filters;
}
// projects orderby
export function buildOrderByClause(orderBy) {
    if (!orderBy) {
        return desc(projects.created_at);
    }
    const [column, direction] = orderBy.split(":");
    const dir = direction?.toLowerCase() === "desc" ? "desc" : "asc";
    return dir === "desc"
        ? sql `${sql.identifier(column)} DESC`
        : sql `${sql.identifier(column)} ASC`;
}
export async function getUserAssignedProjectIds(userId) {
    const userProjects = await db
        .select({ project_id: user_projects.project_id })
        .from(user_projects)
        .where(and(eq(user_projects.user_id, userId), isNull(user_projects.deleted_at)));
    return userProjects.map(up => up.project_id).filter(id => id !== null);
}
// projects with users
export function mapProjectsWithUsers(projects) {
    return projects.map((project) => ({
        projectId: project.id,
        projectName: project.title,
        project_start_date: project.start_date,
        project_end_date: project.end_date,
        projectLogoUrl: project.logo_url,
        projectStatus: project.project_status,
        users: project.userProjects
            .filter((userProject) => userProject.users)
            .map((userProject) => ({
            user_id: userProject.users.id,
            display_name: userProject.users.display_name,
        })),
    }));
}
export function buildProjectsWhereQueryData(startDate, endDate, projectStatus, searchString, user) {
    const whereQueryData = {
        columns: ["deleted_at"],
        values: [null],
    };
    // Search string filter
    if (searchString) {
        whereQueryData.columns.push("title");
        whereQueryData.values.push(`%${searchString}%`);
    }
    // Project status filter
    if (projectStatus?.toUpperCase()) {
        whereQueryData.columns.push("project_status");
        whereQueryData.values.push(projectStatus.toUpperCase());
    }
    // Date range filter
    if (startDate || endDate) {
        whereQueryData.columns.push("due_date");
        const dateFilter = {};
        if (startDate) {
            dateFilter.gte = new Date(`${startDate}T00:00:00`);
        }
        if (endDate) {
            dateFilter.lte = new Date(`${endDate}T23:59:59`);
        }
        whereQueryData.values.push(dateFilter);
    }
    // User-based filtering based on role
    if (user.user_type === "EMPLOYEE" || user.user_type === "TEAM_LEAD") {
        // Employees and Team Leaders can only see projects they're assigned to
        // This assumes you have a user_projects junction table or similar
        whereQueryData.columns.push("created_by");
        whereQueryData.values.push(user.id);
    }
    return whereQueryData;
}
