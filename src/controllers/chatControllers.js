import asyncHandler from "express-async-handler";
import Chat from "../models/chatModel.js";
import User from "../models/user.model.js";

export const accessChat = asyncHandler(async (req, res) => {
  const { userID } = req.body;

  if (!userID) {
    console.log("userID param is not sent with request");
    return res.sendStatus(400);
  }

  let isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userID } } },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  if (isChat && isChat.length !== 0) {
    res.send(isChat[0]);
  } else {
    const chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userID],
    };
    try {
      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findById(createdChat._id).populate("users", "-password");
      res.status(200).send(fullChat);
    } catch (error) {
      res.status(400).send(error.message);
    }
  }
});

export const fetchChats = asyncHandler(async (req, res) => {
  try {
    const results = await Chat.find({ users: { $elemMatch: { $eq: req.user._id } } })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    const populatedResults = await User.populate(results, {
      path: "latestMessage.sender",
      select: "name pic email",
    });

    res.status(200).send(populatedResults);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

export const createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send("Please fill all the details for creating a group");
  }

  const users = JSON.parse(req.body.users);
  
  if (users.length < 1) {
    return res.status(400).send("More than 2 users are required to create a group.");
  }

  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      isGroupChat: true,
      users,
      groupAdmin: req.user,
      dp: req.body.dp,
    });

    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

export const renameGroup = asyncHandler(async (req, res) => {
  try {
    const { chatId, chatName } = req.body;
    const group = await Chat.findByIdAndUpdate(
      chatId,
      { chatName },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!group) {
      res.status(400).send("No group found!");
    } else {
      res.json(group);
    }
  } catch (error) {
    res.status(400).send("Internal server error!");
  }
});

export const updateImageGroup = asyncHandler(async (req, res) => {
  try {
    const { chatId, dp } = req.body;
    const group = await Chat.findByIdAndUpdate(
      chatId,
      { dp },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!group) {
      res.status(400).send("No group found!");
    } else {
      res.json(group);
    }
  } catch (error) {
    res.status(400).send("Internal server error!");
  }
});

export const addToGroup = asyncHandler(async (req, res) => {
  try {
    const { chatID, userID } = req.body;
    const added = await Chat.findByIdAndUpdate(
      chatID,
      { $push: { users: userID } },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!added) {
      res.status(400).send("No group found!");
    } else {
      res.json(added);
    }
  } catch (error) {
    res.status(400).send("Internal server error!");
  }
});

export const removeFromGroup = asyncHandler(async (req, res) => {
  try {
    const { chatID, userID } = req.body;
    const removed = await Chat.findByIdAndUpdate(
      chatID,
      { $pull: { users: userID } },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!removed) {
      res.status(400).send("No group found!");
    } else {
      res.json(removed);
    }
  } catch (error) {
    res.status(400).send("Internal server error!");
  }
});

export const findChat = asyncHandler(async (req, res) => {
  const { chatId } = req.body;

  if (!chatId) {
    return res.status(400).json({ error: "Empty chatID" });
  }

  const chat = await Chat.findById(chatId);

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  res.json(chat);
});

export const changeCount = asyncHandler(async (req, res) => {
  try {
    const { chatId, count } = req.body;
    const group = await Chat.findByIdAndUpdate(
      chatId,
      { count },
      { new: true }
    )
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    if (!group) {
      res.status(400).send("No group found!");
    } else {
      res.json(group);
    }
  } catch (error) {
    res.status(400).send("Internal server error!");
  }
});
