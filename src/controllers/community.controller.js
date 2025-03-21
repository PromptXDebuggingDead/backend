import Community from "../models/community.model.js";

// Create a new community
export const createCommunity = async (req, res) => {
  try {
    const community = await Community.create(req.body);

    if (!community) {
      res.status(400).json({
        success: false,
        message: "Failed to create community",
      });
    }

    return res
      .status(201)
      .json({ success: true, message: "Community Created Successfully" });
  } catch (error) {
    console.log("Error: ", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while Creating Community",
    });
  }
};
