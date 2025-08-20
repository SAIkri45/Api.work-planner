import axios from "axios";

import { slackConfig } from "../config/slackConfig.js";
import { TOKEN_RESPONSE_NOT_FOUND, USER_ACCESS_TOKEN_MISSING, USER_INFO_NOT_FOUND, USER_PROFILE_INFO_NOT_FOUND } from "../constants/appMessages.js";
import NotFoundException from "../exceptions/notFoundException.js";

export async function getOAuthCode(code: string) {
  const tokenResponse = await axios.post(
    "https://slack.com/api/oauth.v2.access",
    null,
    {
      params: {
        code,
        client_id: slackConfig.clientId,
        client_secret: slackConfig.clientSecret,
        redirect_uri: slackConfig.redirectUri,
      },
    },
  );

  if (!tokenResponse)
    throw new NotFoundException(TOKEN_RESPONSE_NOT_FOUND);

  const userId = tokenResponse.data.authed_user?.id;
  const accessToken = tokenResponse.data.authed_user?.access_token;
  const refreshToken = tokenResponse.data.authed_user?.refresh_token;
  const expiresIn = tokenResponse.data.authed_user?.expires_in;

  if (!userId || !accessToken)
    throw new NotFoundException(USER_ACCESS_TOKEN_MISSING);

  // prepare token data
  const tokenData = {
    user_id: userId, // you’ll need to map to your DB user.id
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
  };

  // fetch user info
  const userInfoResponse = await axios.get("https://slack.com/api/users.info", {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { user: userId },
  });

  if (!userInfoResponse)
    throw new NotFoundException(USER_INFO_NOT_FOUND);
  const userInfo = userInfoResponse.data.user;

  const profileResponse = await axios.get(
    "https://slack.com/api/users.profile.get",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { user: userId },
    },
  );

  if (!profileResponse)
    throw new NotFoundException(USER_PROFILE_INFO_NOT_FOUND);

  const profile = profileResponse.data.profile;

  const userData = {
    slack_id: userId.toString(),
    user_name: profile.real_name, // full name
    display_name: profile.display_name, // Slack display name
    email: profile.email,
    profile_pic: profile.image_192,
    designation: profile.title, // designation / description
    statusText: profile.status_text,
    statusEmoji: profile.status_emoji,
    phone: profile.phone,
    // user_type: userInfo,
    user_type: userInfo.is_admin ? "Admin" : "EMPLOYEE",
  };

  return { userData, tokenData };
}

export async function refreshSlackToken(refreshToken: string) {
  const response = await axios.post(
    "https://slack.com/api/oauth.v2.access",
    null,
    {
      params: {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: slackConfig.clientId,
        client_secret: slackConfig.clientSecret,
      },
    },
  );

  const authed = response.data.authed_user || {};
  return {
    access_token: authed.access_token || response.data.access_token,
    refresh_token: authed.refresh_token ?? refreshToken,
    expires_at: Math.floor(Date.now() / 1000) + (authed.expires_in || 43200),
  };
}
