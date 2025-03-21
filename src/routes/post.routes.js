import { Router } from "express";
import { authoriseRoles, verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createPost,
  deletePost,
  getAllPosts,
  likePost,
} from "../controllers/post.controller.js";

const router = Router();

router.route("/create").post(createPost);
router.route("/:id").delete(deletePost);
router.route("/:id").put(deletePost);
router.route("community/:community").get(getAllPosts);
router.route("/:id").get(getAllPosts);
router.route("/like").put(likePost);

export default router;
