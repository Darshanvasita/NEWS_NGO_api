const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');

// Configure Cloudinary
if (process.env.CLOUDINARY_URL) {
  // If CLOUDINARY_URL is provided, use it directly
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL
  });
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  // Otherwise, use individual environment variables
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'news_ngo',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp', 'pdf', 'mp4', 'mov', 'avi', 'mkv'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit' }], // Optional: resize images
    resource_type: 'auto' // Automatically detect resource type
  }
});

// File filter for different types of files
function fileFilter(req, file, cb) {
  // Allow images, PDFs, and videos
  const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|mp4|mov|avi|mkv/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed! Only images, PDFs, and videos are allowed.'), false);
  }
}

// Create the multer instance with Cloudinary storage
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Fallback to local storage if Cloudinary is not configured
const getUploadMiddleware = () => {
  // Check if Cloudinary is configured
  if (process.env.CLOUDINARY_URL || 
      (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)) {
    return upload;
  } else {
    console.warn('Cloudinary not configured. Using local disk storage as fallback.');
    
    const fs = require('fs');
    
    // Ensure uploads folder exists
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Configure Multer storage for local disk storage
    const localStorage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueName =
          Date.now() +
          '-' +
          Math.round(Math.random() * 1e9) +
          path.extname(file.originalname);
        cb(null, uniqueName);
      },
    });

    return multer({ 
      storage: localStorage,
      fileFilter: fileFilter,
      limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
    });
  }
};

module.exports = getUploadMiddleware();