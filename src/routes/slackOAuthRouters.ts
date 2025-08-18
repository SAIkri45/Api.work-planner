import { Hono } from "hono";
import slackOAuthController from "../controllers/slackOAuth";



const oAuthRouter = new Hono();
const slackController = new slackOAuthController();

oAuthRouter.get("/auth/slack", slackController.slackOAuth);
oAuthRouter.get("/auth/slack/callback", slackController.slackOAuthCallback);

export default oAuthRouter;