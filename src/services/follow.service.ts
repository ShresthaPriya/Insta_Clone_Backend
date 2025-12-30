import { prisma } from "../lib/prisma";
import { createNotification } from "./notification.service";

export const NotificationType = {
  FOLLOW_REQUEST: "FOLLOW_REQUEST",
  FOLLOW: "FOLLOW",
  FOLLOW_ACCEPTED: "FOLLOW_ACCEPTED",
} as const;


export const getSuggestions = async (currentUserId: string) => {
  const following = await prisma.userFollows.findMany({
    where: { followerId: currentUserId },
    select: { followingId: true },
  });

  const requests = await prisma.followRequest.findMany({
    where: { senderId: currentUserId },
    select: { receiverId: true },
  });

  const followingSet = new Set(following.map(f => f.followingId));
  const requestedSet = new Set(requests.map(r => r.receiverId));

  const users = await prisma.user.findMany({
    where: { id: { notIn: [currentUserId, ...followingSet] } },
    select: { id: true, userName: true, fullName: true, user_profile: true },
    take: 5,
  });

  return users.map(u => ({
    ...u,
    isFollowing: followingSet.has(u.id),
    isRequested: requestedSet.has(u.id),
  }));
};


export const getFollowers = async (profileUserId: string, currentUserId: string) => {
  const followers = await prisma.userFollows.findMany({
    where: { followingId: profileUserId },
    select: {
      follower: { select: { id: true, userName: true, fullName: true, user_profile: true } },
    },
  });

  const currentUserFollowing = await prisma.userFollows.findMany({
    where: { followerId: currentUserId },
    select: { followingId: true },
  });

  const followingSet = new Set(currentUserFollowing.map(f => f.followingId));

  return followers.map(f => ({
    id: f.follower.id,
    userName: f.follower.userName,
    fullName: f.follower.fullName,
    user_profile: f.follower.user_profile,
    isFollowing: followingSet.has(f.follower.id),
  }));
};


export const getFollowing = async (profileUserId: string, currentUserId: string) => {
  const following = await prisma.userFollows.findMany({
    where: { followerId: profileUserId },
    select: {
      following: { select: { id: true, userName: true, fullName: true, user_profile: true } },
    },
  });

  const currentUserFollowing = await prisma.userFollows.findMany({
    where: { followerId: currentUserId },
    select: { followingId: true },
  });

  const followingSet = new Set(currentUserFollowing.map(f => f.followingId));

  return following.map(f => ({
    id: f.following.id,
    userName: f.following.userName,
    fullName: f.following.fullName,
    user_profile: f.following.user_profile,
    isFollowing: followingSet.has(f.following.id),
  }));
};


export const followUser = async (currentUserId: string, targetUserId: string) => {
  if (currentUserId === targetUserId) {
    throw new Error("Cannot follow yourself");
  }

  const alreadyFollowing = await prisma.userFollows.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    },
  });

  if (alreadyFollowing) {
    return { following: true, requested: false };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { isPrivate: true },
  });

  if (!targetUser) throw new Error("User not found");

  if (!targetUser.isPrivate) {
    await prisma.userFollows.create({
      data: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    });

    await createNotification({
      type: NotificationType.FOLLOW,
      userId: targetUserId,
      content: "started following you",
    });

    return { following: true, requested: false };
  }

  const existingRequest = await prisma.followRequest.findUnique({
    where: {
      senderId_receiverId: {
        senderId: currentUserId,
        receiverId: targetUserId,
      },
    },
  });

  if (!existingRequest) {
    const followRequest = await prisma.followRequest.create({
      data: {
        senderId: currentUserId,
        receiverId: targetUserId,
      },
    });

    await createNotification({
      type: NotificationType.FOLLOW_REQUEST,
      userId: targetUserId,
      followRequestId: followRequest.id,
      content: "requested to follow you",
    });
  }

  return { following: false, requested: true };
};


export const acceptFollowRequest = async (
  currentUserId: string,
  followRequestId: string
) => {
  const request = await prisma.followRequest.findUnique({
    where: { id: followRequestId },
  });

  if (!request || request.receiverId !== currentUserId) {
    throw new Error("Follow request not found");
  }

  await prisma.userFollows.create({
    data: {
      followerId: request.senderId,
      followingId: currentUserId,
    },
  });

  await prisma.followRequest.delete({
    where: { id: followRequestId },
  });

  await prisma.notification.updateMany({
    where: { followRequestId },
    data: { isRead: true },  
  });

  await createNotification({
    type: NotificationType.FOLLOW_ACCEPTED,
    userId: request.senderId,
    followRequestId,
    content: "accepted your follow request",
  });

  const newFollower = await prisma.user.findUnique({
    where: { id: request.senderId },
    select: { id: true, userName: true, fullName: true, user_profile: true },
  });

  return { accepted: true, newFollower };
};



export const rejectFollowRequest = async (
  currentUserId: string,
  followRequestId: string
) => {
  const request = await prisma.followRequest.findUnique({
    where: { id: followRequestId },
  });

  if (!request || request.receiverId !== currentUserId) {
    throw new Error("Request not found");
  }

  await prisma.notification.deleteMany({
    where: { followRequestId },
  });

  await prisma.followRequest.delete({
    where: { id: followRequestId },
  });

  return { rejected: true };
};



export const cancelFollowRequest = async (currentUserId: string, targetUserId: string) => {
  const request = await prisma.followRequest.findUnique({
    where: { senderId_receiverId: { senderId: currentUserId, receiverId: targetUserId } },
  });

  if (!request) return { requested: false };

  await prisma.notification.deleteMany({ where: { followRequestId: request.id } });
  await prisma.followRequest.delete({ where: { id: request.id } });

  return { following: false, requested: false };
};


export const unfollowUser = async (currentUserId: string, targetUserId: string) => {
  await prisma.userFollows.delete({
    where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } },
  });

  return { following: false };
};


export const getFollowState = async (currentUserId: string, targetUserId: string) => {
  const [follow, request] = await Promise.all([
    prisma.userFollows.findUnique({
      where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } },
    }),
    prisma.followRequest.findUnique({
      where: { senderId_receiverId: { senderId: currentUserId, receiverId: targetUserId } },
    }),
  ]);

  return { isFollowing: !!follow, isRequested: !!request };
};
