import { Router } from "express";
import { CreatePostController, editPostController, SoftDeletePostController, GetFeedController, CommentController, LikeController, LikeCommentController,   GetPostByIdController } from "../controller/post.controller";
import { upload } from "../middleware/upload";
import { validateToken } from "../middleware/auth";
import { softDeletePost } from "../services/post.service";

const router = Router();

router.post("/create", validateToken, upload.array("images", 5), CreatePostController);
router.get("/feed", validateToken, GetFeedController);
router.get("/:postId", validateToken, GetPostByIdController);
router.put("/:postId", validateToken, editPostController); //edit
router.delete("/:postId", validateToken, SoftDeletePostController);



// Comments
router.post("/add", validateToken, CommentController.addComment);
router.post("/reply", validateToken, CommentController.replyToComment);
router.get("/:postId/comments", validateToken, CommentController.getComments);


// Likes
router.post("/:postId/like", validateToken, LikeController);
router.post("/comment/:commentId/like", validateToken, LikeCommentController); // Like comment/reply

export default router;
