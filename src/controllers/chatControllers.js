import asyncHandler from "express-async-handler";
import Chat from "../models/chatModel.js";
import mongoose from "mongoose";

export const fetchChats = asyncHandler(async (req, res) => {
  try {
    console.log("user: ", req.user._id);

    const results = await Chat.find({
      user: req.user._id,
    })
      .populate("person", "-password")
      .sort({ updatedAt: -1 });

    console.log("result: ", results);

    res.status(200).send(results);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

