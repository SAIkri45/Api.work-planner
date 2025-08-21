import { drizzle } from "drizzle-orm/node-postgres";
import fs from "node:fs";
import pg from "pg";

import { dbConfig } from "../config/dbConfig.js";
import * as projectSchema from "./schema/project.js";
import * as slackTokensSchema from "./schema/slackTokens.js";
import * as userProjectsSchema from "./schema/userProjects.js";
import * as userSchema from "./schema/users.js";

const { Pool } = pg;

const pool = new Pool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync("./ca.pem").toString(),
  },
});

export const db = drizzle({
  client: pool,
  schema: {

    ...userSchema,
    ...projectSchema,
    ...userProjectsSchema,
    ...slackTokensSchema,
  },
});
