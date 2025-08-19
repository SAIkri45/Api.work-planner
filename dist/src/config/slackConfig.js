import envData from "../env.js";
export const slackConfig = {
    clientId: envData.SLACK_CLIENT_ID,
    clientSecret: envData.SLACK_CLIENT_SECRET,
    redirectUri: envData.SLACK_REDIRECT_URI,
    slackSecret: envData.SESSION_SECRET,
    userScope: "users:read,users.profile:read,users:read.email,team:read",
};
