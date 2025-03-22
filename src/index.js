import axios from "axios";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import FormData from "form-data";
import cloudinary from "cloudinary";
import connectDB from "./db/db.js";
import userRoutes from "./routes/user.routes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import communityRoutes from "./routes/community.routes.js";
import postRoutes from "./routes/post.routes.js";
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
    origin: ["http://localhost:5173", "localhost:3000", "192.168.43.143:3000", "https://glowing-rolypoly-8c3f39.netlify.app", "https://fantastic-bombolone-f8dd8f.netlify.app"],
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
// app.post("/api/v1/moderate", async (req, res) => {
//   try {
//     const { imageUrl, text } = req.body;

//     const FormData = require("form-data");

//     const data = new FormData();
//     data.append("text", text);
//     data.append("lang", "en");
//     data.append(
//       "categories",
//       "profanity,personal,link,drug,text,weapon,spam,content-trade,money-transaction,extremism,violence,self-harm,medical"
//     );
//     data.append("mode", "rules");
//     data.append("api_user", "1477567219"); // Replace with actual API user
//     data.append("api_secret", "Zaq2wQEL7wJS93A4NHP4XwKw9w5K8vmZ"); // Replace wi

//     // Validate input
//     if (!imageUrl && !text) {
//       return res.status(400).json({
//         success: false,
//         message: "Provide either an image URL or text",
//       });
//     }

//     // Prepare API request parameters
//     const params = {
//       api_user: "1477567219",
//       api_secret: "Zaq2wQEL7wJS93A4NHP4XwKw9w5K8vmZ",
//       models:
//         "nudity-2.1,weapon,recreational_drug,medical,offensive-2.0,scam,tobacco,self-harm",
//     };

//     if (imageUrl) {
//       params.url = imageUrl; // If image is provided, add it to params
//     }

//     if (text) {
//       params.text = text; // If text is provided, add it to params
//       params.models += ",text-content,text"; // Enable text moderation
//     }

//     // Send request to SightEngine API
//     const response = await axios.post(
//       "https://api.sightengine.com/1.0/check.json",
//       { params }
//     );

//     // Return API response to frontend
//     res.json({ success: true, data: response.data });
//   } catch (error) {
//     console.error("Moderation error:", error);
//     res.status(500).json({ success: false, message: "Something went wrong" });
//   }
// });

app.post("/api/v1/moderate", async (req, res) => {
  try {
    const { imageUrl, text } = req.body;

    // Validate input
    if (!imageUrl && !text) {
      return res.status(400).json({
        success: false,
        message: "Provide either an image URL or text",
      });
    }

    const apiUser = "1477567219"; // Replace with actual API user
    const apiSecret = "Zaq2wQEL7wJS93A4NHP4XwKw9w5K8vmZ"; // Replace with actual API secret

    let response;

    if (imageUrl) {
      // Moderate Image
      response = await axios.get("https://api.sightengine.com/1.0/check.json", {
        params: {
          api_user: apiUser,
          api_secret: apiSecret,
          url: imageUrl,
          models:
            "nudity-2.1,weapon,recreational_drug,medical,offensive-2.0,scam,tobacco,self-harm",
        },
      });
    } else {
      // Moderate Text
      const data = new FormData();
      data.append("text", text);
      data.append("lang", "en");
      data.append(
        "categories",
        "profanity,personal,link,drug,weapon,spam,content-trade,money-transaction,extremism,violence,self-harm,medical"
      );
      data.append("mode", "rules");
      data.append("api_user", apiUser);
      data.append("api_secret", apiSecret);

      response = await axios.post(
        "https://api.sightengine.com/1.0/text/check.json",
        data,
        {
          headers: { ...data.getHeaders() },
        }
      );
    }

    // Return API response to frontend
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.log(error);

    console.error("Moderation error:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
});

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/community", communityRoutes);
app.use("/api/v1/post", postRoutes);

app.use("/api/v1/chat/", chatRoutes);
app.use("/api/v1/message/", messageRoutes);

// Deployment Setup
// const __dirname1 = path.resolve();
// if (process.env.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname1, "/frontend/build")));
//   app.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"));
//   });
// } else {
//   app.get("/", (req, res) => {
//     res
//       .status(200)
//       .json({ success: true, message: "Server is running Healthy" });
//   });
// }

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start Server
const port = process.env.PORT || 8001;
const server = app.listen(port, () => {
  console.log(`Server ⚙️ running on Port ${port}`);
});

// Content Moderation

// app.post("/api/v1/moderate", async (req, res) => {
//   try {
//     axios
//       .get("https://api.sightengine.com/1.0/check.json", {
//         params: {
//           url: "https://sightengine.com/assets/img/examples/example7.jpg",
//           models:
//             "nudity-2.1,weapon,recreational_drug,medical,offensive-2.0,scam,text-content,text,tobacco,self-harm",
//           api_user: "1477567219",
//           api_secret: "Zaq2wQEL7wJS93A4NHP4XwKw9w5K8vmZ",
//         },
//       })
//       .then(function (response) {
//         // on success: handle response
//         console.log(response.data);
//       })
//       .catch(function (error) {
//         // handle error
//         if (error.response) console.log(error.response.data);
//         else console.log(error.message);
//       });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Something went wrong" });
//   }
// });

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
