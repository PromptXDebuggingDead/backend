import Category from "../models/categories.model.js";

export const createCategory = async (req, res) => {
  try {
    const category = await Category.create(req.body);

    if (!category) {
      return res
        .status(400)
        .json({ success: false, message: "failed to create category" });
    }

    return res
      .status(201)
      .json({ success: true, message: "Category Created Successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "failed to Create Category" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return res
        .status(400)
        .json({ success: false, message: "failed to delete category" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Category deleted Successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "failed to delete Category" });
  }
};
