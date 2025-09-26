const express = require('express');
const {
  uploadENewspaper,
  getAllENewspapers,
  getENewspaperById,
  updateENewspaper,
  deleteENewspaper,
  getPublishedENewspapers,
} = require('../controllers/enewspaper.controller');
const { verifyToken, isEditor } = require('../middlewares/auth.middleware');
const upload = require('../config/cloudinary');

const router = express.Router();

// Public route to get published e-newspapers
router.get('/public', getPublishedENewspapers);

// Protected routes for admin/editor
router.post('/', verifyToken, isEditor, upload.single('file'), uploadENewspaper);
router.get('/', verifyToken, isEditor, getAllENewspapers);
router.get('/:id', verifyToken, isEditor, getENewspaperById);
router.put('/:id', verifyToken, isEditor, updateENewspaper);
router.delete('/:id', verifyToken, isEditor, deleteENewspaper);

module.exports = router;