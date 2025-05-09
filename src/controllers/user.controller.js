import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { uploadOnCloudnary } from "../utils/cloudinary.js";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while generating referesh and access token",
    });
  }
};

const accessCookieOptions = {
  httpOnly: true,
  secure: true,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: true,
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
};

// get user details
const getUser = (req, res) => {
  return res.json({ success: true, message: req.user });
};

// Register Controller
const registerController = async (req, res, next) => {
  try {
    const { name, email, username, password } = req.body;
    if (!name || !email) {
      return res
        .status(400)
        .json({ success: false, message: "All Fields are required" });
    }

    // Check for the existed user

    const isExistingUser = await User.findOne({
      $or: [{ username, email }],
    });

    if (isExistingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    //  Getting the avatar photos

    const avatarLocalPath = req.body?.avatar;

    // Upload the files to cloudinary

    const avatar = await uploadOnCloudnary(avatarLocalPath);

    if (!avatar) {
      return res
        .status(400)
        .json({ success: false, message: "Avatar file is Required" });
    }

    const createdUser = await User.create({
      name,
      username,
      email,
      password,
      avatar,
    });

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      createdUser._id
    );

    const user = await User.findById(createdUser._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong while registering user",
      });
    }

    res
      .status(201)
      .cookie("accessToken", accessToken, accessCookieOptions)
      .cookie("refreshToken", refreshToken, refreshCookieOptions)
      .json({
        success: true,
        user,
        accessToken,
        refreshToken,

        message: "User Registered Successfully",
      });
  } catch (error) {
    console.log("Errror: " + error);
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

// User Login email Controller =====>

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!password || !email) {
      return res
        .status(400)
        .json({ success: false, message: "All Fields are required" });
    }

    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User does not exists" });
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid user credentials" });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    );

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, accessCookieOptions)
      .cookie("refreshToken", refreshToken, refreshCookieOptions)
      .json({
        success: true,
        user: loggedInUser,
        accessToken,
        refreshToken,
        message: "User logged In Successfully",
      });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

// Generate a new refresh token

const refreshAccessToken = async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized request" });
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid refresh token" });
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "Refresh token is expired or used" });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, accessCookieOptions)
      .cookie("refreshToken", refreshToken, refreshCookieOptions)
      .json({
        success: true,
        accessToken,
        refreshToken,
        message: "Access token refreshed",
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Invalid refresh token",
    });
  }
};

// Update user account details

const updateAccountDetails = async (req, res) => {
  try {
    const { name, email, avatar } = req.body;

    if (!name && !email) {
      return res
        .status(400)
        .json({ success: false, message: "No values changed" });
    }

    let user = await User.findById(req?.user._id);

    const updateFields = {};
    if (name && name !== user?.name) updateFields.name = name;
    if (email && email !== user?.email) updateFields.email = email;

    if (avatar) {
      const myCloud = await uploadOnCloudnary(avatar);
      updateFields.avatar = myCloud.secure_url;
    }

    user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: updateFields,
      },
      { new: true }
    ).select("-password -refreshToken");

    return res.status(200).json({
      success: true,
      user,
      message: "Account details updated successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "failed to update account" });
  }
};

// Change the user password =======>

const changeCurrentPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);
    if (user?.isPasswordSet) {
      const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
      if (!isPasswordCorrect) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Password" });
      }

      user.password = newPassword;
      await user.save({ validateBeforeSave: false });

      return res
        .status(200)
        .json({ success: true, message: "Password changed successfully" });
    } else {
      user.password = newPassword;
      user.isPasswordSet = true;
      await user.save({ validateBeforeSave: false });

      return res
        .status(200)
        .json({ success: true, message: "Password changed successfully" });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

// Get the current user =====>

const getCurrentUser = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
      message: "User fetched successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

// Logout the user =====>

const logoutUser = async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: {
          refreshToken: 1, // this removes the field from document
        },
      },
      {
        new: true,
      }
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json({ success: true, message: "User logged Out" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

// ADMIN: Get All users

const getAllUser = async (req, res) => {
  try {
    const users = await User.find().select("-password -refreshToken");

    return res
      .status(200)
      .json({ success: true, users, message: "User logged Out" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

export {
  registerController,
  changeCurrentPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updateAccountDetails,
  getAllUser,
  getUser,
};
