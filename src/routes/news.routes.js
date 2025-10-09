const express = require('express');
const { createNews, getAllNews, getNewsById, deleteNews, updateNews, submitNews, approveNews, rejectNews, getNewsVersions, rollbackNews, addNews } = require('../controllers/news.controller');
const { createSubscription, getSubscriptionStatus } = require('../controllers/subscription.controller');
const { verifyToken, isReporter, isAdmin, isEditor, isNewsUser } = require('../middlewares/auth.middleware');
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
router.post('/', verifyToken, isNewsUser, isReporter, upload.single('pdf'), createNews);

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
 *   put:
 *     summary: Update a news article by ID
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the news article to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       '200':
 *         description: News updated successfully
 *       '403':
 *         description: Access denied
 *       '404':
 *         description: News not found
 */
router.put('/:id', verifyToken, isNewsUser, (req, res, next) => {
  if (req.user.role === 'reporter' || req.user.role === 'editor' || req.user.role === 'admin') {
    next();
  } else {
    res.status(403).send({ message: 'Access denied' });
  }
}, updateNews);

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
router.delete('/:id', verifyToken, isNewsUser, isAdmin, deleteNews);

/**
 * @swagger
 * /api/news/{id}/submit:
 *   patch:
 *     summary: Submit a news article for approval
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the news article to submit
 *     responses:
 *       '200':
 *         description: News submitted for approval
 *       '403':
 *         description: Access denied
 *       '404':
 *         description: News not found
 */
router.patch('/:id/submit', verifyToken, isNewsUser, isReporter, submitNews);

/**
 * @swagger
 * /api/news/{id}/approve:
 *   patch:
 *     summary: Approve a news article
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the news article to approve
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               publishedAt:
 *                  type: string
 *                  format: date-time
 *                  description: Optional. Set a future date for scheduled publishing.
 *     responses:
 *       '200':
 *         description: News approved and published
 *       '403':
 *         description: Access denied
 *       '404':
 *         description: News not found
 */
router.patch('/:id/approve', verifyToken, isNewsUser, isEditor, approveNews);

/**
 * @swagger
 * /api/news/{id}/reject:
 *   patch:
 *     summary: Reject a news article
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the news article to reject
 *     responses:
 *       '200':
 *         description: News rejected
 *       '403':
 *         description: Access denied
 *       '404':
 *         description: News not found
 */
router.patch('/:id/reject', verifyToken, isNewsUser, isEditor, rejectNews);

/**
 * @swagger
 * /api/news/{id}/versions:
 *   get:
 *     summary: Get all versions of a news article
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the news article
 *     responses:
 *       '200':
 *         description: A list of news versions
 *       '403':
 *         description: Access denied
 *       '404':
 *         description: News not found
 */
router.get('/:id/versions', verifyToken, isNewsUser, isEditor, getNewsVersions);

/**
 * @swagger
 * /api/news/{id}/rollback/{versionId}:
 *   patch:
 *     summary: Rollback a news article to a specific version
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the news article
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the news version to rollback to
 *     responses:
 *       '200':
 *         description: News rolled back successfully
 *       '403':
 *         description: Access denied
 *       '404':
 *         description: News or version not found
 */
router.patch('/:id/rollback/:versionId', verifyToken, isNewsUser, isEditor, rollbackNews);

/**
 * @swagger
 * /api/news/add:
 *   post:
 *     summary: Add a new news article for the newsletter
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - link
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               link:
 *                 type: string
 *     responses:
 *       '201':
 *         description: News added successfully
 *       '400':
 *         description: Bad request
 *       '403':
 *         description: Access denied
 */
router.post('/add', verifyToken, isNewsUser, isAdmin, addNews);

// --- Subscription Routes ---

/**
 * @swagger
 * /api/news/subscription:
 *   post:
 *     summary: Subscribe the current user
 *     tags: [News, Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '201':
 *         description: Subscription created successfully
 *       '200':
 *         description: Subscription reactivated
 *       '409':
 *         description: User is already subscribed
 *       '403':
 *         description: Access denied
 */
router.post('/subscription', verifyToken, isNewsUser, createSubscription);

/**
 * @swagger
 * /api/news/subscription/status:
 *   get:
 *     summary: Get the subscription status of the current user
 *     tags: [News, Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Subscription status retrieved successfully
 *       '404':
 *         description: No subscription found for this user
 *       '403':
 *         description: Access denied
 */
router.get('/subscription/status', verifyToken, isNewsUser, getSubscriptionStatus);

module.exports = router;
