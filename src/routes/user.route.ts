import { Router } from "express";
import {
  registerUserController,
  LoginController,
  getUsersController,
  getUserProfilePostController,
  getMeController,
  editUserProfileController,
  followUserController,
  getSuggestionsController,
  getFollowersController,
  getFollowingController
} from "../controller/user.controller";
import { validateToken } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = Router();

router.post("/register", registerUserController);
router.post("/login", LoginController);

router.get("/search", validateToken, getUsersController);
router.get("/suggestions", validateToken, getSuggestionsController);
router.post("/:id/follow", validateToken, followUserController);

router.get("/me", validateToken, getMeController);
router.get("/:username", validateToken, getUserProfilePostController);

router.put("/edit-profile", validateToken, upload.single("user_profile"), editUserProfileController);
router.get("/:userId/followers", validateToken, getFollowersController);
router.get("/:userId/following", validateToken, getFollowingController);



export default router;
