import Community from "../models/community.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";
import { uploadOnCloudnary } from "../utils/cloudinary.js";

// Create a new community
export const createCommunity = async (req, res) => {
  try {
    req.body.createdBy = req.user._id;

    req.body.users = [req.body.createdBy];
    req.body.moderators = [req.body.createdBy];

    //  Getting the avatar photos

    const avatarLocalPath = req.body?.avatar;

    // Upload the files to cloudinary

    const avatar = await uploadOnCloudnary(avatarLocalPath);

    if (!avatar) {
      return res
        .status(400)
        .json({ success: false, message: "Avatar file is Required" });
    }

    req.body.avatar = avatar;

    const community = await Community.create(req.body);

    if (!community) {
      return res.status(400).json({
        success: false,
        message: "Failed to create community",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Community Created Successfully",
      community,
    });
  } catch (error) {
    console.log("Error: ", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while Creating Community",
    });
  }
};

// Get all communities (with pagination)
export const getAllCommunities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || "-createdAt"; // Default sort by newest

    const communities = await Community.find()
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name username avatar")
      .populate("categories", "name")
      .lean();

    const totalCommunities = await Community.countDocuments();

    return res.status(200).json({
      success: true,
      communities,
      pagination: {
        total: totalCommunities,
        page,
        pages: Math.ceil(totalCommunities / limit),
        limit,
      },
    });
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch communities",
    });
  }
};

// Get communities in which user is a member
export const getMyCommunities = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const communities = await Community.find({ users: userId })
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name username avatar")
      .populate("categories", "name")
      .lean();

    const totalCommunities = await Community.countDocuments({ users: userId });

    return res.status(200).json({
      success: true,
      communities,
      pagination: {
        total: totalCommunities,
        page,
        pages: Math.ceil(totalCommunities / limit),
        limit,
      },
    });
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch communities",
    });
  }
};

// Get a single community by ID
export const getCommunityById = async (req, res) => {
  try {
    const { communityId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(communityId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid community ID",
      });
    }

    const community = await Community.findById(communityId)
      .populate("createdBy", "name username avatar")
      .populate("categories", "name")
      .populate("moderators", "name username avatar")
      .lean();

    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    // Get member count instead of populating all members
    community.memberCount = community.users.length;

    return res.status(200).json({
      success: true,
      community,
    });
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch community",
    });
  }
};

export const getCommunityByName = async (req, res) => {
  try {
    const { username } = req.params;

    const community = await Community.findOne({ username })
      .populate("createdBy", "name username avatar")
      .populate("categories", "name")
      .populate("moderators", "name username avatar")
      .lean();

    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    // Get member count instead of populating all members
    community.memberCount = community.users.length;

    return res.status(200).json({
      success: true,
      community,
    });
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch community",
    });
  }
};

// Update community
export const updateCommunity = async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = "67dd5476057cc224e2869e45"; // req.user._id

    if (!mongoose.Types.ObjectId.isValid(communityId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid community ID",
      });
    }

    // Check if user is creator or moderator
    const community = await Community.findById(communityId);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    // Check for permission (creator or moderator)
    const isCreator = community.createdBy.toString() === userId;
    const isModerator = community.moderators.some(
      (mod) => mod.toString() === userId
    );

    if (!isCreator && !isModerator) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this community",
      });
    }

    // Prevent changing createdBy field
    delete req.body.createdBy;
    delete req.body.users;

    // Only creator can modify moderators
    if (!isCreator) {
      delete req.body.moderators;
    }

    const updatedCommunity = await Community.findByIdAndUpdate(
      communityId,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Community updated successfully",
      community: updatedCommunity,
    });
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update community",
    });
  }
};

// Delete community
export const deleteCommunity = async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = "67dd5476057cc224e2869e45"; // req.user._id

    if (!mongoose.Types.ObjectId.isValid(communityId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid community ID",
      });
    }

    const community = await Community.findById(communityId);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    // Only creator can delete community
    if (community.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Only the community creator can delete this community",
      });
    }

    await Community.findByIdAndDelete(communityId);

    return res.status(200).json({
      success: true,
      message: "Community deleted successfully",
    });
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete community",
    });
  }
};

// Fetch communities by categories/interests
export const getCommunitiesByCategories = async (req, res) => {
  try {
    const { categories } = req.body; // Array of category IDs

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one category ID",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const communities = await Community.find({
      categories: { $in: categories },
    })
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name username avatar")
      .populate("categories", "name")
      .lean();

    const totalCommunities = await Community.countDocuments({
      categories: { $in: categories },
    });

    return res.status(200).json({
      success: true,
      communities,
      pagination: {
        total: totalCommunities,
        page,
        pages: Math.ceil(totalCommunities / limit),
        limit,
      },
    });
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch communities by categories",
    });
  }
};

// Join community
export const joinCommunity = async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = "67dd5476057cc224e2869e45"; // req.user._id

    if (!mongoose.Types.ObjectId.isValid(communityId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid community ID",
      });
    }

    const community = await Community.findById(communityId);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    // Check if user is already a member
    if (community.users.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "You are already a member of this community",
      });
    }

    const updatedCommunity = await Community.findByIdAndUpdate(
      communityId,
      { $push: { users: userId } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Successfully joined the community",
      community: updatedCommunity,
    });
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).json({
      success: false,
      message: "Failed to join community",
    });
  }
};

// Leave community
export const leaveCommunity = async (req, res) => {
  try {
    const { communityId } = req.params;
    const userId = "67dd5476057cc224e2869e45"; // req.user._id

    if (!mongoose.Types.ObjectId.isValid(communityId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid community ID",
      });
    }

    const community = await Community.findById(communityId);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    // Creator cannot leave their own community
    if (community.createdBy.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "Community creator cannot leave the community",
      });
    }

    // Check if user is a member
    if (!community.users.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "You are not a member of this community",
      });
    }

    // Remove from users and moderators (if applicable)
    const updatedCommunity = await Community.findByIdAndUpdate(
      communityId,
      {
        $pull: {
          users: userId,
          moderators: userId,
        },
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Successfully left the community",
      community: updatedCommunity,
    });
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).json({
      success: false,
      message: "Failed to leave community",
    });
  }
};

// Add moderator
export const addModerator = async (req, res) => {
  try {
    const { communityId } = req.params;
    const { userId } = req.body;
    const creatorId = "67dd5476057cc224e2869e45"; // req.user._id

    if (
      !mongoose.Types.ObjectId.isValid(communityId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid community ID or user ID",
      });
    }

    const community = await Community.findById(communityId);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    // Only creator can add moderators
    if (community.createdBy.toString() !== creatorId) {
      return res.status(403).json({
        success: false,
        message: "Only the community creator can add moderators",
      });
    }

    // Check if user is a member
    if (!community.users.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "User must be a member of the community to become a moderator",
      });
    }

    // Check if user is already a moderator
    if (community.moderators.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "User is already a moderator of this community",
      });
    }

    const updatedCommunity = await Community.findByIdAndUpdate(
      communityId,
      { $push: { moderators: userId } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Successfully added moderator",
      community: updatedCommunity,
    });
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add moderator",
    });
  }
};

// Remove moderator
export const removeModerator = async (req, res) => {
  try {
    const { communityId } = req.params;
    const { userId } = req.body;
    const creatorId = "67dd5476057cc224e2869e45"; // req.user._id

    if (
      !mongoose.Types.ObjectId.isValid(communityId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid community ID or user ID",
      });
    }

    const community = await Community.findById(communityId);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    // Only creator can remove moderators
    if (community.createdBy.toString() !== creatorId) {
      return res.status(403).json({
        success: false,
        message: "Only the community creator can remove moderators",
      });
    }

    // Cannot remove creator as moderator
    if (userId === community.createdBy.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot remove the community creator as a moderator",
      });
    }

    // Check if user is a moderator
    if (!community.moderators.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "User is not a moderator of this community",
      });
    }

    const updatedCommunity = await Community.findByIdAndUpdate(
      communityId,
      { $pull: { moderators: userId } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Successfully removed moderator",
      community: updatedCommunity,
    });
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove moderator",
    });
  }
};

// Get trending communities (most new members in last week)
export const getTrendingCommunities = async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const limit = parseInt(req.query.limit) || 5;

    // This would require a separate collection to track joins
    // For now, using a simpler version based on total members and recency
    const communities = await Community.aggregate([
      {
        $addFields: {
          memberCount: { $size: "$users" },
        },
      },
      {
        $match: {
          createdAt: { $gte: oneWeekAgo },
        },
      },
      {
        $sort: {
          memberCount: -1,
          createdAt: -1,
        },
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "creatorInfo",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "categories",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $addFields: {
          createdBy: { $arrayElemAt: ["$creatorInfo", 0] },
          categories: "$categoryInfo",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          bio: 1,
          memberCount: 1,
          "createdBy.name": 1,
          "createdBy.username": 1,
          "createdBy.avatar": 1,
          "categories.name": 1,
          createdAt: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      communities,
    });
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch trending communities",
    });
  }
};

// Get recommended communities for a user
export const getRecommendedCommunities = async (req, res) => {
  try {
    const userId = "67dd5476057cc224e2869e45"; // req.user._id
    const limit = parseInt(req.query.limit) || 5;

    // Get user's joined communities
    const user = await User.findById(userId).select("interests").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find user's joined communities
    const joinedCommunities = await Community.find({
      users: userId,
    })
      .select("_id categories")
      .lean();

    const joinedCommunityIds = joinedCommunities.map((c) => c._id);

    // Collect categories from joined communities
    let userInterests = user.interests || [];
    joinedCommunities.forEach((community) => {
      userInterests = [...userInterests, ...community.categories];
    });

    // Remove duplicates
    userInterests = [...new Set(userInterests.map((id) => id.toString()))];

    // Find communities based on similar categories that user hasn't joined
    const recommendedCommunities = await Community.find({
      _id: { $nin: joinedCommunityIds },
      categories: { $in: userInterests },
    })
      .sort("-createdAt")
      .limit(limit)
      .populate("createdBy", "name username avatar")
      .populate("categories", "name")
      .lean();

    return res.status(200).json({
      success: true,
      communities: recommendedCommunities,
    });
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recommended communities",
    });
  }
};

// Search communities
export const searchCommunities = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const communities = await Community.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { bio: { $regex: query, $options: "i" } },
      ],
    })
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .populate("createdBy", "name username avatar")
      .populate("categories", "name")
      .lean();

    const totalCommunities = await Community.countDocuments({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { bio: { $regex: query, $options: "i" } },
      ],
    });

    return res.status(200).json({
      success: true,
      communities,
      pagination: {
        total: totalCommunities,
        page,
        pages: Math.ceil(totalCommunities / limit),
        limit,
      },
    });
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).json({
      success: false,
      message: "Failed to search communities",
    });
  }
};
