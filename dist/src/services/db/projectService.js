import { eq } from "drizzle-orm";
import { db } from "../../db/configuration.js";
import { projects } from "../../db/schema/projects.js";
export async function getProjectUsersById(id) {
    const result = await db.query.projects.findFirst({
        columns: {
            id: true,
            title: true,
            description: true,
            logo_url: true,
            project_status: true,
        },
        with: {
            userProjects: {
                columns: {},
                with: {
                    users: {
                        columns: {
                            id: true,
                            display_name: true,
                            email: true,
                            user_type: true,
                            user_status: true,
                        },
                    },
                },
            },
        },
        where: eq(projects.id, id),
    });
    if (!result)
        return null;
    const users = result.userProjects
        ?.map(userProject => userProject.users)
        .filter(Boolean)
        ?? [];
    return {
        id: result.id,
        title: result.title,
        description: result.description,
        logo_url: result.logo_url,
        project_status: result.project_status,
        users,
    };
}
