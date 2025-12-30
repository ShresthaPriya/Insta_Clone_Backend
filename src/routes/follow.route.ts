import { Router } from "express";
import { validateToken } from "../middleware/auth";
import { upload } from "../middleware/upload";

import {
  followUserController,
  unfollowUserController,
  getSuggestionsController,
  getFollowersController,
  getFollowingController,
  acceptFollowRequestController,
  rejectFollowRequestController,
  cancelFollowRequestController,
} from "../controller/follow.controller";

const router = Router();


router.get("/suggestions", validateToken, getSuggestionsController);
router.get("/:userId/followers", validateToken, getFollowersController);
router.get("/:userId/following", validateToken, getFollowingController);

router.post("/:id/follow", validateToken, followUserController);
router.post("/:id/unfollow", validateToken, unfollowUserController);
router.delete("/:id/unfollow", validateToken, unfollowUserController);


router.post(
  "/follow-request/:id/accept",
  validateToken,
  acceptFollowRequestController
);

router.delete(
  "/follow-request/:id/reject",
  validateToken,
  rejectFollowRequestController
);

router.delete(
  "/:id/follow-request/cancel",
  validateToken,
  cancelFollowRequestController
);

export default router;
