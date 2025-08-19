import { Hono } from "hono";
import SlackOAuthController from "../controllers/slackOAuthController.js";
const oAuthRouter = new Hono();
const slackController = new SlackOAuthController();
oAuthRouter.get("/auth/slack", slackController.slackOAuth);
oAuthRouter.get("/auth/slack/callback", slackController.slackOAuthCallback);
export default oAuthRouter;
