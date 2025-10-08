import { Hono } from "hono";

import { UsersController } from "../controllers/usersControllers.js";
import { isAuthorized, isManagerOrAdmin } from "../middlewares/isAuthorized.js";

const userController = new UsersController();
const userRoutes = new Hono();

userRoutes.get("/dropdown", isAuthorized, userController.getUsersDropdown);
userRoutes.get("/removed-projects", isAuthorized, userController.getAllUserRemovedProjects);
userRoutes.get("/employees", isAuthorized, userController.getEmployeesList);
userRoutes.get("/:id", isAuthorized, userController.getUserById);
// admin
userRoutes.post("/", isManagerOrAdmin, userController.createUserByAdmin);
userRoutes.get("/", isAuthorized, userController.getPaginatedUsers);
userRoutes.patch("/:id/reset-password", isAuthorized, userController.resetPassword);
userRoutes.patch("/:id", isAuthorized, userController.updateUser);
userRoutes.patch("/:id/status", isManagerOrAdmin, userController.updateUserStatus);
userRoutes.delete("/:id", isManagerOrAdmin, userController.softDeleteUserById);

export default userRoutes;
