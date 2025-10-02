import axios from "axios";

export const uploadImage = async (file) => {
  if (!file) return null;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("dujke6es1", "chatapp"); // replace with your preset

  try {
    const response = await axios.post(
      "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload", // replace with your cloud name
      formData
    );
    return response.data.secure_url; // this is the uploaded image URL
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
};
