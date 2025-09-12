import { Hono } from "hono";

import { UsersController } from "../controllers/usersControllers.js";
import { isEmployeAuthorized } from "../middlewares/slackMiddlewares.js";

const userController = new UsersController();
const userRoutes = new Hono();

// userRoutes.get("/", isEmployeAuthorized,  userController.getPaginatedUsers);
userRoutes.get("/:id", userController.getUserById);
userRoutes.patch("/:id", userController.editUser);

userRoutes.get("/dropdown", userController.getUsersDropdown);

userRoutes.get("/employees", userController.getEmployeesList);
userRoutes.put("/:id/userDetails", userController.updateInternalUser);
userRoutes.post("/", isEmployeAuthorized, userController.addUser);

export default userRoutes;
