import { Request, Response } from "express";
import * as PostService from "../services/post.service";

export const CreatePostController = async (req: Request, res: Response) => {
  try {
 
    const userId = (req as any).user?.id; 

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized. No user ID." });
    }

    const { caption, location } = req.body;

    if (!caption) {
      return res.status(400).json({ message: "Caption is required." });
    }

    const images = req.files as Express.Multer.File[];

    if (!images || images.length === 0) {
      return res.status(400).json({ message: "Images are required." });
    }

    const urls = images.map((file) => `/uploads/${file.filename}`);

    const newPost = await PostService.CreatePost({
      userId,
      caption,
      location,
      urls,
    });

    return res.status(201).json({
      message: "Post created successfully.",
      post: newPost,
    });
  } catch (err) {
    console.error("Error creating post:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};

export const GetFeedController = async (req: Request, res: Response) => {
  try {
    const posts = await PostService.getFeedPosts();
    return res.status(200).json(posts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch feed" });
  }
};
