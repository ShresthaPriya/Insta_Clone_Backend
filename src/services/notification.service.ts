import { prisma } from "../lib/prisma";
import { emitNotification } from "../socket/socket";

export interface CreateNotificationInput {
  type: string;
  content?: string;
  userId: string; 
  postId?: string;
  commentId?: string;
  followRequestId?: string;
  isRead?: boolean;
}

export const createNotification = async (data: CreateNotificationInput) => {
  const notificationData: any = {
    type: data.type,
    content: data.content ?? "",
    userId: data.userId,
    postId: data.postId ?? null,
    commentId: data.commentId ?? null,
    isRead: data.isRead ?? false,
  };

  if (data.followRequestId) {
    const followRequestExists = await prisma.followRequest.findUnique({
      where: { id: data.followRequestId },
    });

    if (followRequestExists) {
      notificationData.followRequestId = data.followRequestId;
    } else {
      console.log(`FollowRequest with ID ${data.followRequestId} not found. Skipping followRequestId.`);
    }
  }

  const notification = await prisma.notification.create({
    data: notificationData,
    include: {
      post: {
        include: {
          user: { select: { userName: true, user_profile: true } },
        },
      },
      comment: {
        include: {
          user: { select: { userName: true, user_profile: true } },
        },
      },
      followRequest: {
        include: {
          sender: { select: { id: true, userName: true, user_profile: true } },
        },
      },
    },
  });

  emitNotification(data.userId, notification);

  return notification;
};


export const getMyNotifications = async (currentUserId: string) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: currentUserId },
    include: {
      followRequest: {
        include: {
          sender: { select: { id: true, userName: true, user_profile: true } },
          receiver: { select: { id: true, userName: true, user_profile: true } },
        },
      },
      post: { include: { user: { select: { id: true, userName: true, user_profile: true } } } },
      comment: { include: { user: { select: { id: true, userName: true, user_profile: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const results = [];

  for (const n of notifications) {
    let sender = null;

    if (["FOLLOW", "FOLLOW_REQUEST", "FOLLOW_ACCEPTED"].includes(n.type)) {
      switch (n.type) {
        case "FOLLOW":
          const follow = await prisma.userFollows.findFirst({
            where: { followingId: currentUserId },
            orderBy: { createdAt: "desc" },
            select: { follower: { select: { id: true, userName: true, user_profile: true } } },
          });
          sender = follow?.follower ?? null;
          break;

        case "FOLLOW_REQUEST":
          sender = n.followRequest?.sender ?? null;
          break;

        case "FOLLOW_ACCEPTED":
          sender = n.followRequest?.receiver ?? null;
          break;
      }
    } 
    else if (["LIKE", "COMMENT", "REPLY"].includes(n.type)) {
      switch (n.type) {
        case "LIKE":
          if (n.postId) {
            const like = await prisma.like.findFirst({
              where: { postId: n.postId, userId: { not: currentUserId } },
              orderBy: { createdAt: "desc" },
              include: { user: { select: { id: true, userName: true, user_profile: true } } },
            });
            sender = like?.user ?? null;
          }
          break;

        case "COMMENT":
        case "REPLY":
          if (n.commentId) {
            const comment = await prisma.comments.findUnique({
              where: { id: n.commentId },
              include: { user: { select: { id: true, userName: true, user_profile: true } } },
            });
            sender = comment?.user ?? null;
          }
          break;
      }
    }

    results.push({
      id: n.id,
      type: n.type,
      isRead: n.isRead,
      userId: n.userId,
      postId: n.postId ?? undefined,
      commentId: n.commentId ?? undefined,
      followRequestId: n.followRequestId ?? undefined,
      sender,
      post: n.post
        ? {
            id: n.post.id,
            urls: n.post.urls ?? [],
            userName: n.post.user?.userName,
            user_profile: n.post.user?.user_profile ?? null,
          }
        : undefined,
      followRequestStatus: n.followRequest?.status ?? undefined,
    });
  }

  return results;
};

export const markAsRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: { 
      userId, 
      isRead: false,
      type: { not: "FOLLOW_REQUEST" }  
    },
    data: { isRead: true },
  });

  return { success: true };
};
