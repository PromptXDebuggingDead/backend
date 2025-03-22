import { Router } from "express";
import { authoriseRoles, verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createPost,
  deletePost,
  getAllPosts,
  getOverallPosts,
  getSinglePost,
  likePost,
} from "../controllers/post.controller.js";

const router = Router();

router.route("/create").post(verifyJWT, createPost);
router.route("/:id").delete(deletePost);
router.route("/single/:id").get(getSinglePost);
router.route("/community/:community").get(getAllPosts);
router.route("/:id").get(getAllPosts);
router.route("/all/data").get(getOverallPosts);

router.route("/like/:id").put(verifyJWT, likePost);

export default router;
