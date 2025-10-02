// lib/Upload.js
import axios from "axios";
import { toast } from "react-hot-toast";

const CLOUD_NAME = "dujke6es1";      // replace with your Cloudinary Cloud Name
const UPLOAD_PRESET = "chatapp"; // replace with your unsigned preset

/**
 * Uploads a file to Cloudinary and returns the secure URL.
 * @param {File} file - The file to upload
 * @returns {Promise<string>} - The uploaded image URL
 */
const upload = async (file) => {
  if (!file) {
    toast.error("No file selected");
    return null;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData
    );

    return response.data.secure_url; // this is the Cloudinary URL
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    toast.error("Image upload failed");
    return null;
  }
};

export default upload;
