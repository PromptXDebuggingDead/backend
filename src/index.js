import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cloudinary from "cloudinary";
import connectDB from "./db/db.js";
import userRoutes from "./routes/user.routes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";
import path from "path";
import { Server } from "socket.io";

// Load environment variables
dotenv.config({
  path: "../.env",
});

// Initialize Express
const app = express();

// Middlewares
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "localhost:3000",
      "192.168.43.143:3000",
      "talk-a-tive-qnvy.onrender.com",
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Connect Database
connectDB()
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error", err));

// Define Routes
app.use("/api/v1/user", userRoutes);
app.use("/api/chat/", chatRoutes);
app.use("/api/message/", messageRoutes);

// Deployment Setup
const __dirname1 = path.resolve();
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res
      .status(200)
      .json({ success: true, message: "Server is running Healthy" });
  });
}

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start Server
const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`Server ⚙️ running on Port ${port}`);
});

// Setup Socket.io
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: [
      "http://localhost:3000",
      "192.168.43.143:3000",
      "talk-a-tive-qnvy.onrender.com",
    ],
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User joined Room:", room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (msg) => {
    const chat = msg.chat;
    if (!chat?.users) return console.log("Chat users not defined.");

    chat.users.forEach((user) => {
      if (user._id !== msg.sender._id) {
        socket.in(user._id).emit("message received", msg);
      }
    });
  });

  socket.off("setup", () => {
    console.log("USER disconnected!");
    socket.leave(userData._id);
  });
});
