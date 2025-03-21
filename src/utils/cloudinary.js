import { v2 as cloudinary } from "cloudinary";

const uploadOnCloudnary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    }

    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: "social",
      resource_type: "auto",
    });

    console.log(result.secure_url);

    return result.secure_url;
  } catch (error) {
    console.log(error);

    return null;
  }
};

export { uploadOnCloudnary };
