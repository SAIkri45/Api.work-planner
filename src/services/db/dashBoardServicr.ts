import { isNull } from "drizzle-orm";

import { db } from "../../db/configuration";
import { task_assignees } from "../../db/schema/taskAssignees";
import { Tasks } from "../../db/schema/tasks";
import { users } from "../../db/schema/users";

export async function getUserTaskStatistics() {
  return await db.query.users.findMany({
    where: isNull(users.deleted_at),
    columns: {
      display_name: true,
    },
    with: {
      task_assignees: {
        where: isNull(task_assignees.deleted_at),
        columns: {
          id: true,
        },
        with: {
          task: {
            where: isNull(Tasks.deleted_at),
            columns: {
              id: true,
              task_status: true,
            },
          },
          groupBy: {
            user_id: true,
            task_status: true,
          },

        },
      },
    },
  });
}
