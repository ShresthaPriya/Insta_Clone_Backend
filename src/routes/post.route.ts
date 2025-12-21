import { Router } from "express";
import { CreatePostController, GetFeedController, CommentController, LikeController, LikeCommentController } from "../controller/post.controller";
import { upload } from "../middleware/upload";
import { validateToken } from "../middleware/auth";

const router = Router();

router.post("/create", validateToken, upload.array("images", 5), CreatePostController);
router.get("/feed", validateToken, GetFeedController);

// Comments
router.post("/add", validateToken, CommentController.addComment);
router.post("/reply", validateToken, CommentController.replyToComment);
router.get("/:postId/comments", validateToken, CommentController.getComments);

// Likes
router.post("/:postId/like", validateToken, LikeController);
router.post("/comment/:commentId/like", validateToken, LikeCommentController); // Like comment/reply

export default router;
