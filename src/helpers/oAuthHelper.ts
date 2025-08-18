import axios from "axios";
import { slackConfig } from "../config/slckConfig";
import NotFoundException from "../exceptions/notFoundException";
import { ACCESS_TOKEN_NOT_FOUND, USER_ACCESS_TOKEN_MISSING, USER_INFO_NOT_FOUND, USER_PROFILE_INFO_NOT_FOUND } from "../constants/appMessages";


export async function getOAuthCode(code: string) {

    // Step 1: Exchange code for tokens
    const tokenResponse = await axios.post(
        'https://slack.com/api/oauth.v2.access',
        null,
        {
            params: {
                code,
                client_id: slackConfig.clientId,
                client_secret: slackConfig.clientSecret,
                redirect_uri: slackConfig.redirectUri,
            },
        }
    );

    if (!tokenResponse.data.ok) {
        throw new Error(`Slack token error: ${tokenResponse.data.error}`);
    }

    // User access token
    const userAccessToken = tokenResponse.data.authed_user?.access_token;

    if (!userAccessToken) {
        throw new NotFoundException(USER_ACCESS_TOKEN_MISSING);
    }

    const userId = tokenResponse.data.authed_user?.id;

    if (!userId) {
        throw new NotFoundException(ACCESS_TOKEN_NOT_FOUND);
    }

    const userInfoResponse = await axios.get("https://slack.com/api/users.info", {
        headers: { Authorization: `Bearer ${userAccessToken}` },
        params: { user: userId }
    });

    if (!userInfoResponse) {
        throw new NotFoundException(USER_INFO_NOT_FOUND);
    }

    const userInfo = userInfoResponse.data.user;

    // Step 2: Fetch full user profile
    const profileResponse = await axios.get("https://slack.com/api/users.profile.get", {
        headers: { Authorization: `Bearer ${userAccessToken}` },
        params: { user: userId }
    });

    if (!profileResponse) {
        throw new NotFoundException(USER_PROFILE_INFO_NOT_FOUND);
    }


    const profile = profileResponse.data.profile;

    const userData = {
        slackId: userId,
        username: profile.real_name,          // full name
        displayName: profile.display_name,    // Slack display name
        email: profile.email,
        profilePic: profile.image_192,
        title: profile.title,                 // designation / description
        statusText: profile.status_text,
        statusEmoji: profile.status_emoji,
        phone: profile.phone,
        usertype: userInfo,
        userRole: userInfo.is_admin ? "admins" : "Employee",
        accessToken: userAccessToken,
    };

    console.log("userData---------->", userData);
    return userData;
}