export function sendSuccessResp(c, status, message, data) {
    const resp = {
        status,
        success: true,
        message,
    };
    if (data !== undefined) {
        resp.data = data;
    }
    return c.json(resp, status);
}
export function sendResponse(c, p0, p1, p2, status, message) {
    return c.json({ status, success: false, message }, status);
}
export function sendErrorResp(c, status, message, data) {
    const resp = {
        status,
        success: false,
        message,
    };
    if (data) {
        resp.data = data;
    }
    return c.json(resp, status);
}
