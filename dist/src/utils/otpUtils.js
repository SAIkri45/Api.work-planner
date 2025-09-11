export function prepareOTPData(user, action, expireInMin = 15, type) {
    // const OTP = randomOTP();
    const OTP = "1234";
    let data;
    const expiresAt = new Date(Date.now() + expireInMin * 60 * 1000);
    if (type) {
        data = {
            action,
            otp: OTP,
            expires_at: expiresAt,
            email: user.email,
        };
    }
    else {
        data = {
            action,
            otp: OTP,
            expires_at: expiresAt,
            phone: user.phone,
        };
    }
    return data;
}
// function randomOTP() {
//   return `${Math.floor(1000 + Math.random() * 9000)}`;
// }
