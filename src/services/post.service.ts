import { prisma } from "../lib/prisma";
import { CreatePostInput } from "../types/posts";

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

export const getFeedPosts = async () => {
  return prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, userName: true, fullName: true } },
    },
  });
};

export const getPostsByUser = async (userId: string) => {
  return prisma.post.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};
