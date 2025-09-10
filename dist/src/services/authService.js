"use strict";
// // services/userService.ts
// import { users } from "../db/schema/users.js";
// import { getSingleRecordByAColumnValue } from "../services/db/baseDbService.js";
// import  NotFoundException from "../exceptions/notFoundException.js";
// import UnauthorizedException from "../exceptions/unauthorizedException.js";
// //import env from "../env.js";
// const DEFAULT_PASSWORD = "123456";
// export async function signInWithEmailService(email: string, password: string) {
//   const user = await getSingleRecordByAColumnValue<typeof users, "email">(users, "email", email);
//   if (!user) {
//     throw new NotFoundException("User not found");
//   }
//     // Compare with default password
//   if (password !== DEFAULT_PASSWORD) {
//     throw new UnauthorizedException("Invalid credentials");
//   }
//   if (user?.user_status !== "ACTIVE" || !user) {
//     throw new UnauthorizedException("User is not active");
//   }
//   return user;
// }
