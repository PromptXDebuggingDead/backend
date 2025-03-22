import mongoose, { Schema } from "mongoose";

const communitySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    moderators: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    guidelines: [],
    categories: [],
  },

  { timestamps: true }
);

export default mongoose.model("Community", communitySchema);
