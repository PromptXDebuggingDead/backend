import Post from "../models/post.model.js";

// Create a new post
export const createPost = async (req, res) => {
  try {
    req.body.user = req.user?._id;
    const post = await Post.create(req.body);

    if (!post) {
      res.status(400).json({
        success: false,
        message: "Failed to create post",
      });
    }

    return res
      .status(201)
      .json({ success: true, message: "Post Created Successfully", post });
  } catch (error) {
    console.log("Error: ", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while Creating Post",
    });
  }
};

export const getSinglePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id).populate("user", "community");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "No Posts found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Post Fetched Successfully",
      data: post,
    });
  } catch (error) {
    console.log("Error: ", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching Post",
    });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const { community } = req.params;
    const posts = await Post.find({ community }).populate("user", "community");

    if (!posts || posts.length == 0) {
      return res.status(404).json({
        success: false,
        message: "No Posts found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Post Fetched Successfully",
      data: posts,
    });
  } catch (error) {
    console.log("Error: ", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching Post",
    });
  }
};

export const getOverallPosts = async (req, res) => {
  try {
    const posts = await Post.find();
    console.log("Posyts: ", posts);

    if (!posts || posts.length == 0) {
      return res.status(404).json({
        success: false,
        message: "No Posts found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Post Fetched Successfully",
      data: posts,
    });
  } catch (error) {
    console.log("Error: ", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching Post",
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByIdAndDelete(id);

    if (!post) {
      res.status(400).json({
        success: false,
        message: "Failed to delete post",
      });
    }

    return res
      .status(201)
      .json({ success: true, message: "Post Deleted Successfully" });
  } catch (error) {
    console.log("Error: ", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting Post",
    });
  }
};

// Route for increasing or decreasing likes

export const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      res.status(404).json({
        success: false,
        message: "No Posts found",
      });
    }
    // Check if the user has already liked
    const isLiked = post.likes.filter(
      (like) => like.user.toString() === req.user._id.toString()
    );

    if (isLiked.length > 0) {
      // remove like
      const index = post.likes.findIndex(
        (like) => like.user.toString() === req.user._id.toString()
      );

      post.likes.splice(index, 1);
    } else {
      // add like
      post.likes.push({ user: req.user._id });
    }

    await post.save();

    return res.status(201).json({
      success: true,
      message: "Post Liked Successfully",
      data: post,
    });
  } catch (error) {
    console.log("Error: ", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting Post",
    });
  }
};
