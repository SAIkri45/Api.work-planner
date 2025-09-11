import axios from "axios";

import { slackConfig } from "../config/slackConfig.js";
import { TOKEN_RESPONSE_NOT_FOUND, USER_ACCESS_TOKEN_MISSING, USER_INFO_NOT_FOUND, USER_PROFILE_INFO_NOT_FOUND } from "../constants/appMessages.js";
import ConflictException from "../exceptions/conflictException.js";
import NotFoundException from "../exceptions/notFoundException.js";

// export async function getOAuthCode(code: string) {
//   const tokenResponse = await axios.post(
//     "https://slack.com/api/oauth.v2.access",
//     null,
//     {
//       params: {
//         code,
//         client_id: slackConfig.clientId,
//         client_secret: slackConfig.clientSecret,
//         redirect_uri: slackConfig.redirectUri,
//       },
//     },
//   );

//   if (!tokenResponse)
//     throw new NotFoundException(TOKEN_RESPONSE_NOT_FOUND);

//   const userId = tokenResponse.data.authed_user?.id;
//   const accessToken = tokenResponse.data.authed_user?.access_token;
//   const refreshToken = tokenResponse.data.authed_user?.refresh_token;
//   const expiresIn = tokenResponse.data.authed_user?.expires_in;

//   if (!userId || !accessToken)
//     throw new NotFoundException(USER_ACCESS_TOKEN_MISSING);

//   // prepare token data
//   const tokenData = {
//     user_id: userId, // you’ll need to map to your DB user.id
//     access_token: accessToken,
//     refresh_token: refreshToken,
//     expires_at: Math.floor(Date.now() / 1000) + expiresIn,
//   };

//   // fetch user info
//   const userInfoResponse = await axios.get("https://slack.com/api/users.info", {
//     headers: { Authorization: `Bearer ${accessToken}` },
//     params: { user: userId },
//   });

//   if (!userInfoResponse)
//     throw new NotFoundException(USER_INFO_NOT_FOUND);
//   const userInfo = userInfoResponse.data.user;

//   const profileResponse = await axios.get(
//     "https://slack.com/api/users.profile.get",
//     {
//       headers: { Authorization: `Bearer ${accessToken}` },
//       params: { user: userId },
//     },
//   );

//   if (!profileResponse)
//     throw new NotFoundException(USER_PROFILE_INFO_NOT_FOUND);

//   const profile = profileResponse.data.profile;

//   const userData = {
//     slack_id: userId.toString(),
//     user_name: profile.real_name, // full name
//     display_name: profile.display_name, // Slack display name
//     email: profile.email,
//     profile_pic: profile.image_192,
//     designation: profile.title, // designation / description
//     statusText: profile.status_text,
//     statusEmoji: profile.status_emoji,
//     phone: profile.phone,
//     // user_type: userInfo,
//     user_type: userInfo.is_admin ? "ADMIN" : "EMPLOYEE",
//   };

//   return { userData, tokenData };
// }

// export async function refreshSlackToken(refreshToken: string) {
//   const response = await axios.post(
//     "https://slack.com/api/oauth.v2.access",
//     null,
//     {
//       params: {
//         grant_type: "refresh_token",
//         refresh_token: refreshToken,
//         client_id: slackConfig.clientId,
//         client_secret: slackConfig.clientSecret,
//       },
//     },
//   );

//   const authed = response.data.authed_user || {};
//   return {
//     access_token: authed.access_token || response.data.access_token,
//     refresh_token: authed.refresh_token ?? refreshToken,
//     expires_at: Math.floor(Date.now() / 1000) + (authed.expires_in || 43200),
//   };
// }

// Fixed getOAuthCode function with proper error handling and debugging

export async function getOAuthCode(code: string) {
  try {
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

    // Check if the response is valid
    if (!tokenResponse || !tokenResponse.data.ok) {
      throw new NotFoundException(TOKEN_RESPONSE_NOT_FOUND);
    }

    // FIXED: Handle different OAuth response structures
    // For user tokens, check authed_user first, then fall back to root level
    const authedUser = tokenResponse.data.authed_user;
    const userId = authedUser?.id;

    // For user-scoped apps, access_token is usually in authed_user
    // For bot-scoped apps, it's at the root level
    const accessToken = authedUser?.access_token || tokenResponse.data.access_token;

    // Refresh token location can vary
    const refreshToken = authedUser?.refresh_token || tokenResponse.data.refresh_token;

    // Expires in is usually in authed_user for user tokens
    const expiresIn = authedUser?.expires_in || tokenResponse.data.expires_in || 43200; // 12 hours default

    if (!userId || !accessToken) {
      throw new NotFoundException(USER_ACCESS_TOKEN_MISSING);
    }

    // Prepare token data
    const tokenData = {
      user_id: userId,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    };

    // Fetch user info using the correct token
    const userInfoResponse = await axios.get("https://slack.com/api/users.info", {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { user: userId },
    });

    if (!userInfoResponse || !userInfoResponse.data.ok) {
      throw new NotFoundException(USER_INFO_NOT_FOUND);
    }
    const userInfo = userInfoResponse.data.user;

    // Fetch user profile
    const profileResponse = await axios.get("https://slack.com/api/users.profile.get", {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { user: userId },
    });

    if (!profileResponse || !profileResponse.data.ok) {
      throw new NotFoundException(USER_PROFILE_INFO_NOT_FOUND);
    }

    const profile = profileResponse.data.profile;

    const userData = {
      slack_id: userId.toString(),
      user_name: profile.real_name,
      display_name: profile.display_name,
      email: profile.email,
      profile_pic: profile.image_192,
      designation: profile.title,
      statusText: profile.status_text,
      statusEmoji: profile.status_emoji,
      phone: profile.phone,
      user_type: userInfo.is_admin ? "ADMIN" : "EMPLOYEE",
    };

    return { userData, tokenData };
  }
  catch (error) {
    throw error;
  }
}

// Also fix the refresh token function
export async function refreshSlackToken(refreshToken: string) {
  try {
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

    if (!response.data.ok) {
      throw new ConflictException("Failed to refresh token");
    }

    const authedUser = response.data.authed_user || {};

    return {
      access_token: authedUser.access_token || response.data.access_token,
      refresh_token: authedUser.refresh_token || refreshToken, // Keep original if not provided
      expires_at: Math.floor(Date.now() / 1000) + (authedUser.expires_in || response.data.expires_in || 43200),
    };
  }
  catch (error) {
    throw error;
  }
}
