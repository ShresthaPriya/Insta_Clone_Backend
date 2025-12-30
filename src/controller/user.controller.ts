import { Request, Response } from "express";
import { registerSchema, loginSchema, profileSchema } from "../validator/user.validator";
import { 
  RegisterUser, 
  UserLogin, 
  getUsers, 
  getUserProfilePost, 
  getMe, 
  editUserProfile, 
  updateAccountPrivacy,
} from "../services/user.service";
import { AuthRequest } from "../middleware/auth";


export const registerUserController = async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await RegisterUser(data);

    if (!result.success)
      return res.status(409).json({ success: false, message: result.message });

    return res.status(201).json({ success: true, message: "User registered", user: result.user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error", error: err });
  }
};


export const LoginController = async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await UserLogin(data);

    if (!result.success)
      return res.status(401).json({ success: false, message: result.message });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error", error: err });
  }
};


export const getUsersController = async (req: Request, res: Response) => {
  try {
    const search = String(req.query.search || "");
    const users = await getUsers(search);
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const updateAccountPrivacyController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { isPrivate } = req.body;

    if (typeof isPrivate !== "boolean") {
      return res.status(400).json({ message: "Invalid privacy value" });
    }

    const user = await updateAccountPrivacy(req.user!.id, isPrivate);

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update privacy" });
  }
};



export const getUserProfilePostController = async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user!.id; 
    const user = await getUserProfilePost({ userName: username }, currentUserId);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user profile posts" });
  }
};


export const getMeController = async (req: AuthRequest, res: Response) => {
  try {
    const user = await getMe(req.user!.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};



export const editUserProfileController = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = profileSchema.parse(req.body); 
    const updatedUser = await editUserProfile(req.user!.id, validatedData, req.file?.filename);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err: any) {
    console.error(err);
    if (err?.issues) {
      return res.status(400).json({ success: false, errors: err.issues });
    }
    return res.status(500).json({ success: false, message: err.message || "Failed to update profile" });
  }
};

