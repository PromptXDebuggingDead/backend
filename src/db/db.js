import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URL}`
    );
    console.log(`\nMongoDB connected to ${connectionInstance.connection.host}`);
  } catch (error) {
    console.log(error);
  }
};

export default connectDB;
