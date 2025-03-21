import asyncHandler from "express-async-handler";
import Message from "../models/messageModel.js";
import User from "../models/user.model.js";
import Chat from "../models/chatModel.js";

export const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId, time } = req.body;
  if (!content || !chatId) {
    return res.status(400).send("Inappropriate data for sending the message");
  }

  const newMessage = {
    sender: req.user._id,
    content,
    chat: chatId,
    time,
  };

  try {
    let message = await Message.create(newMessage);
    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await message.populate("time");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    message = await User.populate(message, {
      path: "chat.latestMessage",
    });

    message = await User.populate(message, {
      path: "chat.groupAdmin",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message,
    });

    res.json(message);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

export const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");
    
    res.json(messages);
  } catch (error) {
    res.status(400).send(error.message);
  }
});
