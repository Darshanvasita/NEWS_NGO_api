const express = require('express');
const { createNews, getAllNews, getNewsById, deleteNews } = require('../controllers/news.controller');
const { verifyToken, isReporter, isAdmin } = require('../middlewares/auth.middleware');
const upload = require('../config/cloudinary');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: News
 *   description: News management
 */

/**
 * @swagger
 * /api/news:
 *   post:
 *     summary: Create a new news article
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - date
 *               - pdf
 *             properties:
 *               title:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               pdf:
 *                 type: string
 *                 format: binary
 *                 description: The PDF file to upload.
 *     responses:
 *       '201':
 *         description: News created successfully
 *       '400':
 *         description: Bad request (e.g., missing file)
 *       '403':
 *         description: Access denied
 */
router.post('/', verifyToken, isReporter, upload.single('pdf'), createNews);

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Get all news articles with pagination
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       '200':
 *         description: A list of news articles
 */
router.get('/', getAllNews);

/**
 * @swagger
 * /api/news/{id}:
 *   get:
 *     summary: Get a single news article by ID
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the news article
 *     responses:
 *       '200':
 *         description: The news article
 *       '404':
 *         description: News not found
 */
router.get('/:id', getNewsById);

/**
 * @swagger
 * /api/news/{id}:
 *   delete:
 *     summary: Delete a news article by ID
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the news article to delete
 *     responses:
 *       '200':
 *         description: News deleted successfully
 *       '403':
 *         description: Access denied
 *       '404':
 *         description: News not found
 */
router.delete('/:id', verifyToken, isAdmin, deleteNews);

module.exports = router;
