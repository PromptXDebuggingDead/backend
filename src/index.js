import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
const app = express();
import dotenv from "dotenv";
import cloudinary from "cloudinary";
import connectDB from "./db/db.js";
dotenv.config({
  path: "../.env",
});

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const port = process.env.PORT || 8000;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

connectDB()
  .then(() => {
    // Listening for error
    app.on("error", (error) => {
      console.log("Error in server!! \n\n", error);
    });

    app.listen(port, () => {
      console.log(`Server ⚙️ running on Port ${port}`);
    });
  })
  .catch((err) => {
    console.log(`ERROR: Error in mongoDb connecton!!`);
  });

app.use("/api/v1/auth", userRoutes);

app.get("/", (req, res) => {
  return res
    .status(200)
    .json({ success: true, message: "Server is running Healthy" });
});
