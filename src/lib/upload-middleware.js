import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'public/uploads';
    
    // Determine subdirectory based on file type
    if (file.mimetype.startsWith('image/')) {
      uploadPath += '/images';
    } else if (file.mimetype === 'text/csv') {
      uploadPath += '/csv';
    } else {
      uploadPath += '/documents';
    }
    
    // Create directory if it doesn't exist
    try {
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(new Error('Failed to create upload directory'));
    }
  },
  filename: function (req, file, cb) {
    try {
      // Generate a unique filename to prevent overwriting
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const fileName = path.basename(file.originalname, ext) + '-' + uniqueSuffix + ext;
      cb(null, fileName);
    } catch (error) {
      cb(new Error('Failed to generate filename'));
    }
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit to match client-side
  },
  fileFilter: function (req, file, cb) {
    // Allow files based on type
    if (file.mimetype.startsWith('image/') || 
        file.mimetype === 'text/csv' || 
        file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed types: images, CSV, PDF, and Word documents'));
    }
  }
});

export default (req, res, next) => {
  if (req.path === '/api/upload') {
    upload.single('file')(req, res, (err) => {
      res.setHeader('Content-Type', 'application/json');
      
      if (err) {
        return res.status(400).json({ 
          success: false,
          message: err.message 
        });
      }
      
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: 'No file uploaded' 
        });
      }
      
      try {
        const relativePath = path.relative('public/uploads', req.file.path);
        res.status(200).json({
          success: true,
          path: '/uploads/' + relativePath,
          message: 'File uploaded successfully'
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Server error while processing upload'
        });
      }
    });
  } else {
    next();
  }
};