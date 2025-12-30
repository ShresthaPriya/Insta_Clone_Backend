import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { CommentService, EditPost, softDeletePost} from "../services/post.service";
import { AuthRequest } from "../middleware/auth";
import * as PostService from "../services/post.service";

// Create Post
export const CreatePostController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { caption, location } = req.body;
    const images = req.files as Express.Multer.File[];

    if (!caption || !images?.length) return res.status(400).json({ message: "Missing fields" });

    const urls = images.map((file) => `/uploads/${file.filename}`);
    const newPost = await PostService.CreatePost({ userId, caption, location, urls });

    return res.status(201).json({ message: "Post created", post: newPost });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const editPostController = async (req: Request, res: Response) => {
  try {
       const userId = (req as any).user?.id;
    const { postId } = req.params;
    const { caption, urls } = req.body;

    const post = await EditPost({
      postId,
      userId,
      caption,
      urls,
      
    });

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      post,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update post",
    });
  }
};

//soft delete
export const SoftDeletePostController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;
    const { postId } = req.params;

    await PostService.softDeletePost(postId, userId);

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to delete post",
    });
  }
};


// Get feed
export const GetFeedController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const posts = await PostService.getFeedPosts(userId);
    res.status(200).json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch feed" });
  }
};




// Comment Controller
export const CommentController = {
  addComment: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { postId, text, parentCommentId } = req.body;

      if (!postId || !text) return res.status(400).json({ message: "Missing fields" });

      const comment = await CommentService.addComment({ postId, userId, text, parentCommentId });
      res.status(201).json({ comment });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to add comment" });
    }
  },

  replyToComment: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const { postId, text, parentCommentId } = req.body;

      if (!parentCommentId) return res.status(400).json({ message: "parentCommentId required" });

      const reply = await CommentService.replyToComment({ postId, userId, text, parentCommentId });
      res.status(201).json({ reply });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to reply" });
    }
  },

 getComments: async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const currentUserId = req.user!.id;
    const comments = await CommentService.getComments(postId, currentUserId);
    res.status(200).json({ comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
},

};

// Like Post
export const LikeController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { postId } = req.params;
    const { liked } = await PostService.likePostService(postId, userId);

    const updatedPost = await prisma.post.findUnique({ where: { id: postId }, select: { likesCount: true } });
    res.json({ liked, likesCount: updatedPost?.likesCount || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to toggle like" });
  }
};

// Like Comment/Reply
export const LikeCommentController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { commentId } = req.params;

    const comment = await prisma.comments.findUnique({
      where: { id: commentId },
      include: { likes: true },
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const existing = await prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });

    if (existing) {
      await prisma.commentLike.delete({ where: { id: existing.id } });
      return res.json({ liked: false, likesCount: comment.likes.length - 1 });
    }

    await prisma.commentLike.create({ data: { commentId, userId } });
   const likesCount = await prisma.commentLike.count({ where: { commentId } });
return res.json({ liked: !existing, likesCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to toggle comment like" });
  }
};

export const GetPostByIdController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { postId } = req.params;
    const userId = req.user!.id;

    const post = await PostService.getPostByIdService(postId, userId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post);
  } catch (err) {
    console.error("Get post by id error:", err);
    res.status(500).json({ message: "Failed to fetch post" });
  }
};


