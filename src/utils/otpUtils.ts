import type { User } from "../db/schema/users.js";
import type { ActionType, OTPData } from "../types/appTypes.js";

export function prepareOTPData(user: User, action: ActionType, expireInMin = 15, type?: boolean) {
  // const OTP = randomOTP();
  const OTP = "1234";
  let data: OTPData;
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
