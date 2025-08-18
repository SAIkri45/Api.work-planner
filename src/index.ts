import type { Context } from "hono";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { DEF_ERROR_RESP } from "./constants/appMessages";
import oAuthRouter from "./routes/slackOAuthRouters";
import { appConfig } from "./config/appConfig";
import envData from "./env";

const apiVer = appConfig.version;
const app = new Hono().basePath(`/v${apiVer}`);
const port = envData.PORT || 3000;

app.use("*", cors());

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.route("/", oAuthRouter);

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
  port: 3000,
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});
