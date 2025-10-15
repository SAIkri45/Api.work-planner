import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { initSocket } from "../socket/index.js";
import { appConfig } from "./config/appConfig.js";
import { DEF_ERROR_RESP } from "./constants/appMessages.js";
import envData from "./env.js";
import authRoutes from "./routes/authRouters.js";
import dashBoardRoutes from "./routes/dashBoardRoutes.js";
import notificationRoute from "./routes/notificationRoutes.js";
import projectRouter from "./routes/projectRoutes.js";
import oAuthRouter from "./routes/slackOAuthRouters.js";
import taskAssigneesRoutes from "./routes/taskAssigneesRoutes.js";
import taskRouter from "./routes/taskRoutes.js";
import userRoutes from "./routes/usersRouters.js";
import { chatRoutes } from "./routes/chatRoutes.js";
const apiVer = appConfig.version;
const app = new Hono().basePath(`/${apiVer}`);
const port = envData.PORT || 3000;
app.use("*", cors());
// app.use(
//   "*",
//   cors({
//     origin: [
//       "http://localhost:3000",
//     ],
//     credentials: true,
//   }),
// );
app.get("/", (c) => {
    return c.text("Hello Hono!");
});
app.route("/tasks", taskRouter);
app.route("/projects", projectRouter);
app.route("/dash-board", dashBoardRoutes);
app.route("/", oAuthRouter);
app.route("/users", userRoutes);
app.route("/task-assignees", taskAssigneesRoutes);
app.route("/notifications", notificationRoute);
app.route("/chats", chatRoutes);
app.route("/auth", authRoutes);
// handling errors globally
app.onError((err, c) => {
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
const server = serve({
    fetch: app.fetch,
    port,
});
// eslint-disable-next-line no-console
console.log(`Server is running on port ${port}`);
initSocket(server);
