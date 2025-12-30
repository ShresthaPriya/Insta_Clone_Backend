import { prisma } from "../lib/prisma";
import { CreatePostInput, CommentInput, EditPostInput } from "../types/posts";
import { createNotification } from "./notification.service";

const mapComment = (comment: any, currentUserId: string) => ({
  id: comment.id,
  text: comment.text,
  createdAt: comment.createdAt,
  user: comment.user,
  likesCount: comment.likes.length,
  likedByCurrentUser: comment.likes.some((l: any) => l.userId === currentUserId),
  replies: comment.replies
    ? comment.replies.map((r: any) => ({
        id: r.id,
        text: r.text,
        createdAt: r.createdAt,
        user: r.user,
        likesCount: r.likes.length,
        likedByCurrentUser: r.likes.some((l: any) => l.userId === currentUserId),
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
        select: { id: true, userName: true, fullName: true },
      },
    },
  });
};

export const EditPost = async (data: EditPostInput) => {
  const post = await prisma.post.findUnique({
    where: { id: data.postId },
    select: { userId: true },
  });

  if (!post) throw new Error("Post not found");
  if (post.userId !== data.userId) throw new Error("You are not allowed to edit this post");

  return prisma.post.update({
    where: { id: data.postId },
    data: {
      ...(data.caption !== undefined && { caption: data.caption }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.urls !== undefined && { urls: data.urls }),
    },
    include: { user: { select: { id: true, userName: true, fullName: true } } },
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
      include: { user: true, likes: true, replies: { include: { user: true, likes: true } } },
    });

    await prisma.post.update({ where: { id: data.postId }, data: { commentsCount: { increment: 1 } } });

    // Notification to post owner
    const post = await prisma.post.findUnique({ where: { id: data.postId }, select: { userId: true } });
    if (post && post.userId !== data.userId) {
      await createNotification({
        type: "COMMENT",
        userId: post.userId,
        postId: data.postId,
        commentId: comment.id,
      });
    }

    return mapComment(comment, data.userId);
  },

  replyToComment: async (data: CommentInput) => {
    if (!data.parentCommentId) throw new Error("parentCommentId required");

    const reply = await prisma.comments.create({
      data: { postId: data.postId, userId: data.userId, text: data.text, parentCommentId: data.parentCommentId },
      include: { user: true, likes: true },
    });

    await prisma.post.update({ where: { id: data.postId }, data: { commentsCount: { increment: 1 } } });

    const parentComment = await prisma.comments.findUnique({ where: { id: data.parentCommentId }, select: { userId: true } });
    if (parentComment && parentComment.userId !== data.userId) {
      await createNotification({
        type: "REPLY",
        userId: parentComment.userId,
        postId: data.postId,
        commentId: data.parentCommentId,
      });
    }

    return { id: reply.id, text: reply.text, createdAt: reply.createdAt, user: reply.user, likesCount: reply.likes.length, likedByCurrentUser: false };
  },

  getComments: async (postId: string, currentUserId: string) => {
    const comments = await prisma.comments.findMany({
      where: { postId, parentCommentId: null },
      orderBy: { createdAt: "desc" },
      include: { user: true, likes: true, replies: { orderBy: { createdAt: "asc" }, include: { user: true, likes: true } } },
    });
    return comments.map((c) => mapComment(c, currentUserId));
  },

  toggleLike: async (commentId: string, userId: string) => {
    const existing = await prisma.commentLike.findUnique({ where: { commentId_userId: { commentId, userId } } });
    if (existing) await prisma.commentLike.delete({ where: { id: existing.id } });
    else await prisma.commentLike.create({ data: { commentId, userId } });

    const likesCount = await prisma.commentLike.count({ where: { commentId } });
    return { liked: !existing, likesCount };
  },
};



export const getFeedPosts = async (currentUserId: string) => {

  const following = await prisma.userFollows.findMany({
    where: { followerId: currentUserId },
    select: { followingId: true },
  });
  const followingIds = following.map(f => f.followingId);

  if (followingIds.length === 0) return [];

  const posts = await prisma.post.findMany({
    where: {
      deletedAt: null,
      userId: { in: followingIds },
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, userName: true, fullName: true, user_profile: true, isPrivate: true } },
      likes: { select: { userId: true } },
      comments: {
        where: { parentCommentId: null },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, userName: true, fullName: true, user_profile: true } },
          likes: true,
          replies: {
            orderBy: { createdAt: "asc" },
            include: { user: { select: { id: true, userName: true, user_profile: true } }, likes: true },
          },
        },
      },
    },
  });

  const mapComment = (comment: any) => ({
    id: comment.id,
    text: comment.text,
    createdAt: comment.createdAt,
    user: comment.user,
    likesCount: comment.likes.length,
    likedByCurrentUser: comment.likes.some((l: any) => l.userId === currentUserId),
    replies: comment.replies.map((r: any) => ({
      id: r.id,
      text: r.text,
      createdAt: r.createdAt,
      user: r.user,
      likesCount: r.likes.length,
      likedByCurrentUser: r.likes.some((l: any) => l.userId === currentUserId),
    })),
  });

  return posts.map(post => ({
    ...post,
    likesCount: post.likes.length,
    likedByCurrentUser: post.likes.some((l: any) => l.userId === currentUserId),
    comments: post.comments.map(mapComment),
  }));
};


export const getPostByIdService = async (postId: string, currentUserId: string) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: { select: { id: true, userName: true, fullName: true, user_profile: true } },
      likes: { select: { userId: true } },
      comments: {
        where: { parentCommentId: null },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, userName: true, fullName: true, user_profile: true } },
          likes: true,
          replies: {
            orderBy: { createdAt: "asc" },
            include: { user: { select: { id: true, userName: true, fullName: true, user_profile: true } }, likes: true },
          },
        },
      },
    },
  });

  if (!post || post.deletedAt) return null;

  const mapComment = (comment: any) => ({
    id: comment.id,
    text: comment.text,
    createdAt: comment.createdAt,
    user: comment.user,
    likesCount: comment.likes.length,
    likedByCurrentUser: comment.likes.some((l: any) => l.userId === currentUserId),
    replies: comment.replies.map((r: any) => ({
      id: r.id,
      text: r.text,
      createdAt: r.createdAt,
      user: r.user,
      likesCount: r.likes.length,
      likedByCurrentUser: r.likes.some((l: any) => l.userId === currentUserId),
    })),
  });

  return {
    ...post,
    likesCount: post.likes.length,
    likedByCurrentUser: post.likes.some((l: any) => l.userId === currentUserId),
    comments: post.comments.map(mapComment),
  };
};

export const likePostService = async (postId: string, userId: string) => {
  const existingLike = await prisma.like.findFirst({ where: { postId, userId } });

  if (existingLike) {
    await prisma.like.delete({ where: { id: existingLike.id } });
    await prisma.post.update({ where: { id: postId }, data: { likesCount: { decrement: 1 } } });
    return { liked: false };
  }

  await prisma.like.create({ data: { postId, userId } });
  await prisma.post.update({ where: { id: postId }, data: { likesCount: { increment: 1 } } });

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true } });
  if (post && post.userId !== userId) {
    await createNotification({ type: "LIKE", userId: post.userId, postId });
  }

  return { liked: true };
};


export const softDeletePost = async (postId: string, userId: string) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { userId: true },
  });

  if (!post) throw new Error("Post not found");
  if (post.userId !== userId) throw new Error("You cannot delete this post");

  return prisma.post.update({
    where: { id: postId },
    data: {
      deletedAt: new Date(),
      isDeleted: true,      
    },
  });
};

