import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  updateImageGroup,
  changeCount,
  findChat,
} from "../controllers/chatControllers.js";
const router = express.Router();

router.route("/").post(verifyJWT, accessChat);
router.route("/").get(verifyJWT, fetchChats);
router.route("/group").post(verifyJWT, createGroupChat);
router.route("/rename").put(verifyJWT, renameGroup);
router.route("/count").put(verifyJWT, changeCount);
router.route("/dp").put(verifyJWT, updateImageGroup);
router.route("/addGroup").put(verifyJWT, addToGroup);
router.route("/removeGroup").put(verifyJWT, removeFromGroup);
router.route("/findChat").get(findChat);

export default router;
