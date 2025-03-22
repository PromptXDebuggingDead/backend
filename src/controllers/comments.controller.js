import Comment from "../models/comments.model.js";
import mongoose from "mongoose";

// Create a new comment
export const createComments = async (req, res) => {
  try {
    const comments = await Comment.create(req.body);

    if (!comments) {
      return res
        .status(400)
        .json({ success: false, message: "Failed to create comment" });
    }

    return res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: comments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create comment",
      error: error.message,
    });
  }
};

// Get all comments for a specific post
export const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    // Get root level comments (no parent comment)
    const comments = await Comment.find({
      post: postId,
      parentComment: { $exists: false },
    })
      .populate("user", "username profilePicture")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Comments fetched successfully",
      data: comments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch comments",
      error: error.message,
    });
  }
};

// Get a single comment by ID with its replies
export const getCommentById = async (req, res) => {
  try {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid comment ID" });
    }

    const comment = await Comment.findById(commentId)
      .populate("user", "username profilePicture")
      .lean();

    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    // Get replies for this comment
    const replies = await Comment.find({ parentComment: commentId })
      .populate("user", "username profilePicture")
      .sort({ createdAt: 1 })
      .lean();

    // Add replies to the comment
    comment.replies = replies;

    return res.status(200).json({
      success: true,
      message: "Comment fetched successfully",
      data: comment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch comment",
      error: error.message,
    });
  }
};

// Get nested comments (replies)
export const getCommentReplies = async (req, res) => {
  try {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid comment ID" });
    }

    const replies = await Comment.find({ parentComment: commentId })
      .populate("user", "username profilePicture")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      message: "Comment replies fetched successfully",
      data: replies,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch comment replies",
      error: error.message,
    });
  }
};

// Update a comment
export const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid comment ID" });
    }

    // Only allow updating the comment text
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { comment },
      { new: true }
    );

    if (!updatedComment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: updatedComment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update comment",
      error: error.message,
    });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid comment ID" });
    }

    // Find and delete the comment
    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    // Delete all replies to this comment
    await Comment.deleteMany({ parentComment: commentId });

    return res.status(200).json({
      success: true,
      message: "Comment and its replies deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete comment",
      error: error.message,
    });
  }
};

// Like a comment
export const likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(commentId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid comment ID or user ID" });
    }

    // Check if comment exists
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    // Check if user already liked this comment
    const isLiked = comment.likes.some(
      (like) => like.user.toString() === userId
    );

    if (isLiked) {
      // Remove like if already liked
      comment.likes = comment.likes.filter(
        (like) => like.user.toString() !== userId
      );
    } else {
      // Add like
      comment.likes.push({ user: userId });
    }

    await comment.save();

    return res.status(200).json({
      success: true,
      message: isLiked
        ? "Comment unliked successfully"
        : "Comment liked successfully",
      data: comment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to like/unlike comment",
      error: error.message,
    });
  }
};

// Get all comments (for admin purposes)
export const getAllComments = async (req, res) => {
  try {
    const comments = await Comment.find()
      .populate("user", "username profilePicture")
      .populate("post", "title")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "All comments fetched successfully",
      data: comments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch comments",
      error: error.message,
    });
  }
};
