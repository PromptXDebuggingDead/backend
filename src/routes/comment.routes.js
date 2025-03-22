import express from "express";
import {
  createComments,
  getCommentsByPost,
  getCommentById,
  getCommentReplies,
  updateComment,
  deleteComment,
  likeComment,
  getAllComments,
} from "../controllers/comments.controller.js";
import { authoriseRoles, verifyJWT } from "../middlewares/auth.middleware.js";
const router = express.Router();

// Create a comment
router.post("/", verifyJWT, createComments);

// Get all comments (admin route)
router.get("/all", verifyJWT, getAllComments);
// Get comments for a specific post
router.get("/post/:postId", getCommentsByPost);

// Get a specific comment with its replies
router.get("/:commentId", getCommentById);

// Get replies for a specific comment
router.get("/:commentId/replies", getCommentReplies);

// Update a comment
router.put("/:commentId", verifyJWT, updateComment);

// Delete a comment
router.delete("/:commentId", verifyJWT, deleteComment);

// Like/unlike a comment
router.post("/:commentId/like", verifyJWT, likeComment);

export default router;
