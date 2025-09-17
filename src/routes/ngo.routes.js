const express = require('express');
const {
  createStory,
  getAllStories,
  createGalleryItem,
  getAllGalleryItems,
  createDonation,
  getAllDonations,
} = require('../controllers/ngo.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');
const upload = require('../config/cloudinary');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: NGO
 *   description: NGO related operations (Stories, Gallery, Donations)
 */

// --- Stories Routes ---

/**
 * @swagger
 * /api/ngo/stories:
 *   post:
 *     summary: Create a new NGO story
 *     tags: [NGO]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, description, image]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '201':
 *         description: Story created successfully
 *       '403':
 *         description: Access denied
 */
router.post('/stories', verifyToken, isAdmin, upload.single('image'), createStory);

/**
 * @swagger
 * /api/ngo/stories:
 *   get:
 *     summary: Get all NGO stories
 *     tags: [NGO]
 *     responses:
 *       '200':
 *         description: A list of stories
 */
router.get('/stories', getAllStories);


// --- Gallery Routes ---

/**
 * @swagger
 * /api/ngo/gallery:
 *   post:
 *     summary: Add a new photo or video to the gallery
 *     tags: [NGO]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [type, media]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [photo, video]
 *               caption:
 *                 type: string
 *               media:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '201':
 *         description: Gallery item created successfully
 *       '403':
 *         description: Access denied
 */
router.post('/gallery', verifyToken, isAdmin, upload.single('media'), createGalleryItem);

/**
 * @swagger
 * /api/ngo/gallery:
 *   get:
 *     summary: Get all gallery items
 *     tags: [NGO]
 *     responses:
 *       '200':
 *         description: A list of gallery items
 */
router.get('/gallery', getAllGalleryItems);


// --- Donation Routes ---

/**
 * @swagger
 * /api/ngo/donate:
 *   post:
 *     summary: Create a (mock) donation
 *     tags: [NGO]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *                 example: 500.50
 *     responses:
 *       '201':
 *         description: Donation recorded successfully
 *       '401':
 *         description: Not authorized
 *     description: This is a mocked endpoint. It simulates a successful payment without a real payment gateway.
 */
router.post('/donate', verifyToken, createDonation);

/**
 * @swagger
 * /api/ngo/donations:
 *   get:
 *     summary: Get all donations (Admin only)
 *     tags: [NGO]
 *     security:
 *       - bearerAuth: []
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
 *         description: A list of donations
 *       '403':
 *         description: Access denied
 */
router.get('/donations', verifyToken, isAdmin, getAllDonations);

module.exports = router;
