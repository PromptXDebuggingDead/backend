import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  fetchChats,
} from "../controllers/chatControllers.js";
const router = express.Router();

// router.route("/").post(verifyJWT, accessChat);
router.route("/").get(verifyJWT, fetchChats);


export default router;
