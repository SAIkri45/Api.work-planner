import type { Context } from "hono";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { appConfig } from "./config/appConfig.js";
import { DEF_ERROR_RESP } from "./constants/appMessages.js";
import envData from "./env.js";
import projectRouter from "./routes/projectRoutes.js";
import oAuthRouter from "./routes/slackOAuthRouters.js";
import usersRouter from "./routes/usersRouters.js";

const apiVer = appConfig.version;
const app = new Hono().basePath(`/${apiVer}`);
const port = envData.PORT || 3000;

app.use("*", cors());

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/", oAuthRouter);
app.route("/projects", projectRouter);
app.route("/users", usersRouter);

// handling errors globally
app.onError((err: any, c: Context) => {
  const statusCode = err.status || 555;
  const errorMessage = err.message || DEF_ERROR_RESP;
  const method = c.req.method;
  const requestUrl = c.req.url;
  const timestamp = new Date().toISOString();

  console.error(err);

  c.status(statusCode);
  return c.json({
    status: statusCode,
    success: false,
    message: errorMessage,
    name: err.name ?? "UnhandledError",
    errData: err.errData ?? undefined,
    path: requestUrl,
    method,
    timestamp,
  });
});

serve({
  fetch: app.fetch,
  port,
});

// eslint-disable-next-line no-console
console.log(`Server is running on port ${port}`);
