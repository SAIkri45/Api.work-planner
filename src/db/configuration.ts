import { drizzle } from "drizzle-orm/node-postgres";
import fs from "node:fs";
import pg from "pg";

import { dbConfig } from "../config/dbConfig.js";
import * as groupsSchema from "./schema/group.js";

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

    ...groupsSchema,

  },
});
