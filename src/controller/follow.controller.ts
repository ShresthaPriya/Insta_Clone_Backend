import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";

import { getSuggestions, followUser,getFollowers, getFollowing, unfollowUser, acceptFollowRequest,cancelFollowRequest, rejectFollowRequest } from "../services/follow.service";


export const getSuggestionsController = async (req: AuthRequest, res: Response) => {
  try {
    const suggestions = await getSuggestions(req.user!.id);
    res.status(200).json(suggestions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch suggestions" });
  }
};


export const followUserController = async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = req.params.id;
    const result = await followUser(req.user!.id, targetUserId);
    res.status(200).json(result);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ message: err.message || "Failed to follow/unfollow user" });
  }
};

export const getFollowersController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { userId } = req.params;

    const followers = await getFollowers(
      userId,
      req.user!.id
    );

    res.status(200).json({ followers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch followers" });
  }
};

export const getFollowingController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { userId } = req.params;

    const following = await getFollowing(
      userId,
      req.user!.id
    );

    res.status(200).json({ following });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch following" });
  }
};

export const acceptFollowRequestController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const followRequestId = req.params.id; 
    console.log(followRequestId, "requestId");
    const result = await acceptFollowRequest(
      req.user!.id,
      followRequestId
    );
    console.log(result);
    

    res.status(200).json(result);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({
      message: err.message || "Failed to accept follow request",
    });
  }
};


export const cancelFollowRequestController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const targetUserId = req.params.id;
    const result = await cancelFollowRequest(req.user!.id, targetUserId);
    

    res.status(200).json(result);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({
      message: err.message || "Failed to cancel follow request",
    });
  }
};

export const rejectFollowRequestController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const followRequestId = req.params.id; 
    const result = await rejectFollowRequest(
      req.user!.id,
      followRequestId
    );

    res.status(200).json(result);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({
      message: err.message || "Failed to reject follow request",
    });
  }
};



export const unfollowUserController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const targetUserId = req.params.id;
    const result = await unfollowUser(req.user!.id, targetUserId);
    res.status(200).json(result);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({
      message: err.message || "Failed to unfollow user",
    });
  }
};


