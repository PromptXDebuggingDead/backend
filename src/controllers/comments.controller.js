import Comment from "../models/comments.model.js";

export const createComments = async (req, res) => {
  try {
    const comments = await Comment.create(req.body);

    if (!comments) {
      return res
        .status(400)
        .json({ success: false, message: "failed to create Comment" });
    }

    return res
      .status(201)
      .json({ success: true, message: "Comment Created Successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "failed to Create Comment" });
  }
};
