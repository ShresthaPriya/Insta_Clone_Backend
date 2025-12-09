import { Router } from "express";
import { CreatePostController,GetFeedController } from "../controller/post.controller";
import { upload } from "../middleware/upload";
import { validateToken } from "../middleware/auth";

const router = Router();

router.post("/create", validateToken, upload.array("images", 5), CreatePostController);
router.get("/feed", validateToken, GetFeedController);


export default router;





