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
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Use the filename from the request body or generate one
    const fileName = path.basename(req.body.path || file.originalname);
    cb(null, fileName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Validate file types
    if (file.mimetype.startsWith('image/') ||
        file.mimetype === 'text/csv' ||
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

export default (req, res, next) => {
  if (req.path === '/api/upload') {
    if (req.method === 'POST') {
      upload.single('file')(req, res, (err) => {
        if (err) {
          return res.status(400).json({ message: err.message });
        }
        if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded' });
        }
        res.json({
          path: '/uploads/' + path.relative('public/uploads', req.file.path).replace(/\\/g, '/')
        });
      });
    } else if (req.method === 'DELETE') {
      const filePath = path.join('public', req.query.path);
      if (!filePath.startsWith(path.join('public', 'uploads'))) {
        return res.status(400).json({ message: 'Invalid file path' });
      }
      fs.unlink(filePath, (err) => {
        if (err) {
          return res.status(400).json({ message: 'Failed to delete file' });
        }
        res.json({ message: 'File deleted successfully' });
      });
    } else {
      res.status(405).json({ message: 'Method not allowed' });
    }
  } else {
    next();
  }
};