import { prisma } from "../lib/prisma";
import { CreatePostInput, CommentInput } from "../types/posts";

const mapComment = (comment: any, currentUserId: string) => ({
  id: comment.id,
  text: comment.text,
  createdAt: comment.createdAt,
  user: comment.user,
  likesCount: comment.likes.length,
  likedByCurrentUser: comment.likes.some(
    (l: any) => l.userId === currentUserId
  ),
  replies: comment.replies
    ? comment.replies.map((r: any) => ({
        id: r.id,
        text: r.text,
        createdAt: r.createdAt,
        user: r.user,
        likesCount: r.likes.length,
        likedByCurrentUser: r.likes.some(
          (l: any) => l.userId === currentUserId
        ),
      }))
    : [],
});

export const CreatePost = async (data: CreatePostInput) => {
  return prisma.post.create({
    data: {
      userId: data.userId,
      caption: data.caption,
      location: data.location,
      urls: data.urls,
    },
    include: {
      user: {
        select: {
          id: true,
          userName: true,
          fullName: true,
        },
      },
    },
  });
};

export const CommentService = {
  addComment: async (data: CommentInput) => {
    const comment = await prisma.comments.create({
      data: {
        postId: data.postId,
        userId: data.userId,
        text: data.text,
        parentCommentId: data.parentCommentId ?? null,
      },
      include: {
        user: true,
        likes: true,
        replies: { include: { user: true, likes: true } },
      },
    });

    await prisma.post.update({
      where: { id: data.postId },
      data: { commentsCount: { increment: 1 } },
    });

    return mapComment(comment, data.userId);
  },

  replyToComment: async (data: CommentInput) => {
    if (!data.parentCommentId) throw new Error("parentCommentId required");

    const reply = await prisma.comments.create({
      data: {
        postId: data.postId,
        userId: data.userId,
        text: data.text,
        parentCommentId: data.parentCommentId,
      },
      include: { user: true, likes: true },
    });

    await prisma.post.update({
      where: { id: data.postId },
      data: { commentsCount: { increment: 1 } },
    });

    return {
      id: reply.id,
      text: reply.text,
      createdAt: reply.createdAt,
      user: reply.user,
      likesCount: reply.likes.length,
      likedByCurrentUser: false,
    };
  },

  getComments: async (postId: string, currentUserId: string) => {
    const comments = await prisma.comments.findMany({
      where: { postId, parentCommentId: null },
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        likes: true,
        replies: {
          orderBy: { createdAt: "asc" },
          include: { user: true, likes: true },
        },
      },
    });

    return comments.map((c) => mapComment(c, currentUserId));
  },

  toggleLike: async (commentId: string, userId: string) => {
    const existing = await prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId, userId } },
    });

    if (existing) {
      await prisma.commentLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.commentLike.create({ data: { commentId, userId } });
    }

    const likesCount = await prisma.commentLike.count({
      where: { commentId },
    });

    return {
      liked: !existing,
      likesCount,
    };
  },
};


export const likePostService = async (postId: string, userId: string) => {
  const existingLike = await prisma.like.findFirst({
    where: { postId, userId },
  });

  if (existingLike) {
    await prisma.like.delete({
      where: { id: existingLike.id },
    });

    await prisma.post.update({
      where: { id: postId },
      data: { likesCount: { decrement: 1 } },
    });

    return { liked: false };
  }

  await prisma.like.create({
    data: { postId, userId },
  });

  await prisma.post.update({
    where: { id: postId },
    data: { likesCount: { increment: 1 } },
  });

  return { liked: true };
};


export const getFeedPosts = async () => {
  return prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, userName: true, fullName: true, user_profile: true } },
      likes: { select: { userId: true } },
      comments: {
        where: { parentCommentId: null },
        include: {
          user: { select: { id: true, userName: true } },
          replies: {
            include: { user: { select: { id: true, userName: true, user_profile: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
};




