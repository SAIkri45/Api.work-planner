import { Hono } from "hono";

import { UsersController } from "../controllers/usersControllers.js";

const userController = new UsersController();
const userRoutes = new Hono();

userRoutes.get("/", userController.getPaginatedUsers);
userRoutes.get("/:id", userController.getUserById);
userRoutes.patch("/:id", userController.editUser);

userRoutes.get("/dropdown", userController.getUsersDropdown);

userRoutes.get("/employees", userController.getEmployeesList);

export default userRoutes;
