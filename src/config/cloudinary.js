const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'news_ngo_platform', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'png', 'pdf', 'mp4'], // Allowed formats
    // resource_type: 'auto' // Automatically detect resource type (image, video, raw for pdf)
  },
});

// Create the multer instance
const upload = multer({ storage: storage });

module.exports = upload;
