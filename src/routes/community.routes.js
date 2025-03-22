import express from "express";
import { authoriseRoles, verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createCommunity,
  getAllCommunities,
  getCommunityById,
  updateCommunity,
  deleteCommunity,
  getCommunitiesByCategories,
  joinCommunity,
  leaveCommunity,
  addModerator,
  removeModerator,
  getTrendingCommunities,
  getRecommendedCommunities,
  searchCommunities,
  getMyCommunities,
  getCommunityByName,
} from "../controllers/community.controller.js";

const router = express.Router();

// Basic CRUD routes
router.post("/create", verifyJWT, createCommunity);
router.get("/all/data", getAllCommunities);

router.get("/me", verifyJWT, getMyCommunities);
router.get("/name/:username", verifyJWT, getCommunityByName);

router.get("/:communityId", getCommunityById);
router.put("/:communityId", verifyJWT, updateCommunity);
router.delete("/:communityId", verifyJWT, deleteCommunity);

router.post("/by-categories", getCommunitiesByCategories);
router.post("/:communityId/join", verifyJWT, joinCommunity);
router.post("/:communityId/leave", verifyJWT, leaveCommunity);
router.post("/:communityId/moderators", verifyJWT, addModerator);
router.delete("/:communityId/moderators", verifyJWT, removeModerator);
router.get("/trending/list", getTrendingCommunities);
router.get("/recommended/for-user", verifyJWT, getRecommendedCommunities);
router.get("/search/query", searchCommunities);

export default router;
