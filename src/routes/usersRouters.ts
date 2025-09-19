import { Hono } from "hono";

import { UsersController } from "../controllers/usersControllers.js";
import { isAuthorized, isManagerOrAdmin } from "../middlewares/isAuthorized.js";

const userController = new UsersController();
const userRoutes = new Hono();

userRoutes.get("/dropdown", isAuthorized, userController.getUsersDropdown);
userRoutes.get("/employees", isAuthorized, userController.getEmployeesList);
userRoutes.put("/:id/userDetails", isAuthorized, userController.updateInternalUser);
userRoutes.get("/:id", userController.getUserById);
userRoutes.patch("/:id", isAuthorized, userController.editUser);
userRoutes.post("/", isManagerOrAdmin, userController.createUserByAdmin);
userRoutes.get("/", isAuthorized, userController.getPaginatedUsers);

export default userRoutes;
