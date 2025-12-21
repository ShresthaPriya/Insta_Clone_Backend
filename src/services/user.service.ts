import { prisma } from "../lib/prisma";
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../utils/token";
import { registerValidatorType, loginValidatorType, ProfileValidatorType } from "../validator/user.validator";


export const RegisterUser = async (data: registerValidatorType) => {
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ phoneNumber: data.phoneNumber }, { userName: data.userName }] },
  });
  if (existingUser) return { success: false, message: "User already exists" };

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const newUser = await prisma.user.create({
    data: {
      fullName: data.fullName,
      userName: data.userName,
      phoneNumber: data.phoneNumber,
      password: hashedPassword,
      phoneVerified: true,
    },
  });

  return { success: true, user: newUser };
};


export const UserLogin = async (data: loginValidatorType) => {
  const user = await prisma.user.findUnique({ where: { phoneNumber: data.phoneNumber } });
  if (!user) return { success: false, message: "Invalid credentials." };

  const matchPassword = await bcrypt.compare(data.password, user.password);
  if (!matchPassword) return { success: false, message: "Invalid credentials." };

  const accessToken = generateAccessToken({ id: user.id, userName: user.userName });
  const refreshToken = generateRefreshToken({ id: user.id, userName: user.userName });

  return {
    success: true,
    user: { id: user.id, fullName: user.fullName, userName: user.userName, phoneNumber: user.phoneNumber },
    accessToken,
    refreshToken,
  };
};


export const getUsers = async (query: string) => {
  const search = query.trim();
  if (!search) return [];

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { userName: { contains: query, mode: "insensitive" } },
        { fullName: { contains: query, mode: "insensitive" } },
      ],
    },
    select: { userName: true, fullName: true, user_profile: true },
    take: 5,
  });

  return users;
};


export const getUserProfilePost = async (
  identifier: { userName?: string; userId?: string },
  currentUserId?: string
) => {
  const user = await prisma.user.findUnique({
    where: identifier.userId
      ? { id: identifier.userId }
      : { userName: identifier.userName! },
    select: {
      id: true,
      userName: true,
      fullName: true,
      user_profile: true,
      bio: true,
      posts: {
        select: {
          id: true,
          urls: true,
          caption: true,
          likesCount: true,
          commentsCount: true,
        },
      },
    },
  });

  if (!user) return null;

  const followers = await prisma.userFollows.findMany({
    where: { followingId: user.id },
    select: {
      follower: {
        select: {
          id: true,
          userName: true,
          fullName: true,
          user_profile: true,
        },
      },
    },
  });

  const following = await prisma.userFollows.findMany({
    where: { followerId: user.id },
    select: {
      following: {
        select: {
          id: true,
          userName: true,
          fullName: true,
          user_profile: true,
        },
      },
    },
  });

  let isFollowing = false;
  let myFollowingIds: string[] = [];

  if (currentUserId) {
    const myFollowing = await prisma.userFollows.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    myFollowingIds = myFollowing.map(f => f.followingId);
    isFollowing = myFollowingIds.includes(user.id);
  }

  return {
    ...user,
    followersCount: followers.length,
    followingCount: following.length,
    followers: followers.map(f => ({
      ...f.follower,
      isFollowing: myFollowingIds.includes(f.follower.id),
    })),
    following: following.map(f => ({
      ...f.following,
      isFollowing: myFollowingIds.includes(f.following.id),
    })),
    isFollowing,
  };
};


export const getMe = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      userName: true,
      email: true,
      phoneNumber: true,
      bio: true,
      gender: true,
      user_profile: true,
    },
  });
};


export const editUserProfile = async (
  userId: string,
  data: ProfileValidatorType,
  filename?: string
) => {

  if (data.userName) {
    const existingUser = await prisma.user.findFirst({
      where: { userName: data.userName, NOT: { id: userId } },
    });
    if (existingUser) throw new Error("Username already taken");
  }

  if (data.email) {
    const existingEmail = await prisma.user.findFirst({
      where: { email: data.email, NOT: { id: userId } },
    });
    if (existingEmail) throw new Error("Email already taken");
  }

  const updatedData: any = {
    fullName: data.fullName,
    userName: data.userName,
    bio: data.bio,
    email: data.email,
    phoneNumber: data.phoneNumber,
    gender: data.gender,
  };


  if (filename) updatedData.user_profile = filename;

  return prisma.user.update({
    where: { id: userId },
    data: updatedData,
    select: {
      id: true,
      fullName: true,
      userName: true,
      bio: true,
      email: true,
      phoneNumber: true,
      gender: true,
      user_profile: true,
    },
  });
};
export const followUser = async (currentUserId: string, targetUserId: string) => {
  if (currentUserId === targetUserId) throw new Error("Cannot follow yourself");

  const existing = await prisma.userFollows.findUnique({
    where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } },
  });

  if (existing) {

    await prisma.userFollows.delete({
      where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } },
    });
    return { following: false };
  } else {
    
    await prisma.userFollows.create({
      data: { followerId: currentUserId, followingId: targetUserId },
    });
    return { following: true };
  }
};


export const getSuggestions = async (currentUserId: string) => {

  const following = await prisma.userFollows.findMany({
    where: { followerId: currentUserId },
    select: { followingId: true },
  });

  const followingIds = following.map(f => f.followingId);

  if (followingIds.length === 0) {
    const randomUsers = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
      },
      select: {
        id: true,
        userName: true,
        fullName: true,
        user_profile: true,
      },
      take: 5,
    });

    return randomUsers.map(u => ({
      ...u,
      isFollowing: false,
    }));
  }

  const suggestions = await prisma.userFollows.findMany({
    where: {
      followerId: { in: followingIds }, 
      followingId: {
        notIn: [...followingIds, currentUserId], 
      },
    },
    select: {
      following: {
        select: {
          id: true,
          userName: true,
          fullName: true,
          user_profile: true,
        },
      },
    },
    distinct: ["followingId"],
    take: 5,
  });

  return suggestions.map(s => ({
    id: s.following.id,
    userName: s.following.userName,
    fullName: s.following.fullName,
    user_profile: s.following.user_profile,
    isFollowing: false,
  }));
};


