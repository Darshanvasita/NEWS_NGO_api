const express = require("express");
const {
  createNews,
  getAllNews,
  getNewsById,
  deleteNews,
  updateNews,
  submitNews,
  approveNews,
  rejectNews,
  getNewsVersions,
  rollbackNews,
  addNews,
} = require("../controllers/news.controller");
const {
  verifyToken,
  isReporter,
  isAdmin,
  isEditor,
} = require("../middlewares/auth.middleware");
const {
  subscribe,
  verifyOtp,
  unsubscribe,
} = require("../controllers/subscription.controller");
const upload = require("../config/cloudinary");
const { validate, sanitize, validationRules } = require('../middlewares/validation.middleware');

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
router.post("/", sanitize, verifyToken, isReporter, upload.single("pdf"), createNews);

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
router.get("/", getAllNews);

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
router.get("/:id", getNewsById);

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
router.put(
  "/:id",
  sanitize,
  verifyToken,
  (req, res, next) => {
    if (
      req.user.role === "reporter" ||
      req.user.role === "editor" ||
      req.user.role === "admin"
    ) {
      next();
    } else {
      res.status(403).send({ message: "Access denied" });
    }
  },
  updateNews
);

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
router.delete("/:id", verifyToken, isAdmin, deleteNews);

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
router.patch("/:id/submit", verifyToken, isReporter, submitNews);

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
router.patch("/:id/approve", verifyToken, isEditor, approveNews);

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
router.patch("/:id/reject", verifyToken, isEditor, rejectNews);

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
router.get("/:id/versions", verifyToken, isEditor, getNewsVersions);

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
router.patch("/:id/rollback/:versionId", verifyToken, isEditor, rollbackNews);

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
router.post("/add", sanitize, verifyToken, isAdmin, validationRules.news.add, validate, addNews);

/**
 * @swagger
 * /api/news/subscribe:
 *   post:
 *     summary: Initiate subscription and send OTP
 *     tags: [Subscription]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       '200':
 *         description: OTP sent successfully
 *       '400':
 *         description: Bad request
 *       '409':
 *         description: Email already subscribed
 */

router.post("/subscribe", subscribe);

/**
 * @swagger
 * /api/news/subscribe/verify-otp:
 *   post:
 *     summary: Verify OTP and complete subscription
 *     tags: [Subscription]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Subscription successful
 *       '400':
 *         description: Invalid OTP or expired
 */
router.post("/verify-otp", verifyOtp);

console.log("Subscription routes loaded.");

/**
 * @swagger
 * /api/news/subscribe/unsubscribe:
 *   get:
 *     summary: Unsubscribe from the newsletter
 *     tags: [Subscription]
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: The email to unsubscribe.
 *     responses:
 *       '200':
 *         description: Unsubscribed successfully
 *       '400':
 *         description: Email is required
 *       '404':
 *         description: Email not found
 */
router.get("/unsubscribe", unsubscribe);

// Mount e-newspaper routes under /api/news/E-news
const enewspaperRoutes = require("./enewspaper.routes");
router.use("/E-news", enewspaperRoutes);

module.exports = router;
