const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET, // cloudinary package ki madad se mei apne cloud ko config kr lia...matlab apne cloud ki information de di jisse ki mei image store kr paaau
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "HelpStudent",
    allowedFormats: ["jpeg", "png", "jpg"],
  },
});

module.exports = {
  cloudinary,
  storage,
};
