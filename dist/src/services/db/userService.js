import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/configuration.js";
import { user_projects } from "../../db/schema/userProjects.js";
import { buildFiltersRemovedUserProjects, buildOrderByClauseRemovedUserProjects } from "../../helpers/userHelper.js";
export async function getAllRemovedProject(userId, offset, pageSize, search, orderBy) {
    const filters = await buildFiltersRemovedUserProjects(search);
    const orderByClause = buildOrderByClauseRemovedUserProjects(orderBy);
    const result = await db.query.projects.findMany({
        where: and(...filters),
        orderBy: orderByClause,
        offset,
        limit: pageSize,
        columns: {
            id: true,
            title: true,
            description: true,
            logo_url: true,
            project_status: true,
            start_date: true,
            due_date: true,
            created_at: true,
        },
        with: {
            userProjects: {
                where: and(eq(user_projects.user_id, userId)),
                orderBy: desc(user_projects.created_at),
            },
        },
    });
    const removedProjects = result.filter((project) => {
        const deletedRows = project.userProjects.filter((userProject) => userProject.deleted_at !== null);
        const activeRows = project.userProjects.filter((userProject) => userProject.deleted_at === null);
        return deletedRows.length > 0 && activeRows.length === 0;
    });
    const mappedResult = removedProjects.map((project) => ({
        id: project.id,
        title: project.title,
        logo_url: project.logo_url,
        project_status: project.project_status,
        start_date: project.start_date,
        end_date: project.due_date,
        created_at: project.created_at,
    }));
    return { result: mappedResult, total_records: mappedResult.length };
}
