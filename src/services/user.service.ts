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
    isPrivate: true,
    posts: {
      where: {
        deletedAt: null,
        isDeleted: false, 
      },
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
    select: { followerId: true },
  });

  const following = await prisma.userFollows.findMany({
    where: { followerId: user.id },
    select: { followingId: true },
  });

  let isFollowing = false;
  let isRequested = false;

  if (currentUserId) {
    isFollowing = followers.some(
      (f) => f.followerId === currentUserId
    );

    const request = await prisma.followRequest.findUnique({
      where: {
        senderId_receiverId: {
          senderId: currentUserId,
          receiverId: user.id,
        },
      },
    });

    isRequested = !!request;
  }

  const isOwnProfile = currentUserId === user.id;

  const canViewPosts =
    !user.isPrivate || isFollowing || isOwnProfile;

  return {
    id: user.id,
    userName: user.userName,
    fullName: user.fullName,
    bio: user.bio,
    user_profile: user.user_profile,
    isPrivate: user.isPrivate,

    posts: canViewPosts ? user.posts : [],

    followersCount: followers.length,
    followingCount: following.length,

    isFollowing,
    isRequested,
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
      isPrivate: true,
    },
  });
};

export const updateAccountPrivacy = async (
  userId: string,
  isPrivate: boolean
) => {
  return prisma.user.update({
    where: { id: userId },
    data: { isPrivate },
    select: {
      id: true,
      isPrivate: true,
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


