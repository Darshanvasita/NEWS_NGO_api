const express = require("express");
const {
  uploadENewspaper,
  getAllENewspapers,
  getENewspaperById,
  updateENewspaper,
  deleteENewspaper,
  getPublishedENewspapers,
} = require("../controllers/enewspaper.controller");
const { verifyToken, isEditor } = require("../middlewares/auth.middleware");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     e-newspaper:
 *       type: object
 *       required:
 *         - filePath
 *         - publishDate
 *         - userId
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated ID of the e-newspaper
 *           example: 1
 *         filePath:
 *           type: string
 *           description: Path to the uploaded e-newspaper file
 *           example: "/uploads/1634567890123-newspaper.pdf"
 *         publishDate:
 *           type: string
 *           format: date-time
 *           description: The date when the e-newspaper should be published
 *           example: "2023-10-20T10:00:00.000Z"
 *         userId:
 *           type: integer
 *           description: ID of the user who uploaded the e-newspaper
 *           example: 1
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the e-newspaper was created
 *           example: "2023-10-18T14:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the e-newspaper was last updated
 *           example: "2023-10-18T14:30:00.000Z"
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             name:
 *               type: string
 *               example: "John Doe"
 *             email:
 *               type: string
 *               example: "john@example.com"
 *     ENewspaperUpload:
 *       type: object
 *       required:
 *         - publishDate
 *         - file
 *       properties:
 *         publishDate:
 *           type: string
 *           format: date-time
 *           description: The date when the e-newspaper should be published
 *           example: "2023-10-20T10:00:00.000Z"
 *         file:
 *           type: string
 *           format: binary
 *           description: The e-newspaper file to upload (PDF, image, etc.)
 *     ENewspaperUpdate:
 *       type: object
 *       properties:
 *         publishDate:
 *           type: string
 *           format: date-time
 *           description: The new publish date for the e-newspaper
 *           example: "2023-10-21T10:00:00.000Z"
 *     ApiResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Response message
 *         error:
 *           type: string
 *           description: Error message (if any)
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   responses:
 *     UnauthorizedError:
 *       description: Access token is missing or invalid
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Unauthorized"
 *     ForbiddenError:
 *       description: User doesn't have required permissions
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Access denied. Editor role required."
 *     NotFoundError:
 *       description: E-newspaper not found
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "E-Newspaper not found"
 *     ValidationError:
 *       description: Validation error
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Validation failed"
 *               error:
 *                 type: string
 *                 example: "Publish date is required"
 *     ServerError:
 *       description: Internal server error
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 example: "Internal server error"
 *               error:
 *                 type: string
 * 
 * tags:
 *   - name: E-Newspapers (Public)
 *     description: Public endpoints for accessing published e-newspapers
 *   - name: E-Newspapers (Admin)
 *     description: Admin/Editor endpoints for managing e-newspapers
 */

/**
 * @swagger
 * /api/news/e-newspaper/public:
 *   get:
 *     summary: Get all published e-newspapers (Public access)
 *     description: Retrieve all e-newspapers that have been published. Optionally filter by date. No authentication required.
 *     tags: [E-Newspapers (Public)]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter e-newspapers by specific date (YYYY-MM-DD format)
 *         example: "2023-10-20"
 *     responses:
 *       200:
 *         description: List of published e-newspapers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ENewspaper'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// Public route to get published e-newspapers
router.get("/public", getPublishedENewspapers);

/**
 * @swagger
 * /api/news/e-newspaper:
 *   post:
 *     summary: Upload a new e-newspaper
 *     description: Upload a new e-newspaper file with publish date. Requires editor role.
 *     tags: [E-Newspapers (Admin)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - publishDate
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The e-newspaper file to upload (PDF, images, etc.)
 *               publishDate:
 *                 type: string
 *                 format: date-time
 *                 description: The date when the e-newspaper should be published
 *                 example: "2023-10-20T10:00:00.000Z"
 *     responses:
 *       201:
 *         description: E-newspaper uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ENewspaper'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
// Protected routes for admin/editor
router.post(
  "/",
  verifyToken,
  isEditor,
  upload.single("file"),
  uploadENewspaper
);
/**
 * @swagger
 * /api/news/e-newspaper:
 *   get:
 *     summary: Get all e-newspapers (Admin/Editor only)
 *     description: Retrieve all e-newspapers with user information. Requires editor role.
 *     tags: [E-Newspapers (Admin)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all e-newspapers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ENewspaper'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/", verifyToken, isEditor, getAllENewspapers);
/**
 * @swagger
 * /api/news/e-newspaper/{id}:
 *   get:
 *     summary: Get a specific e-newspaper by ID
 *     description: Retrieve a single e-newspaper with user information. Requires editor role.
 *     tags: [E-Newspapers (Admin)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the e-newspaper to retrieve
 *         example: 1
 *     responses:
 *       200:
 *         description: E-newspaper retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ENewspaper'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/:id", verifyToken, isEditor, getENewspaperById);
/**
 * @swagger
 * /api/news/e-newspaper/{id}:
 *   put:
 *     summary: Update an e-newspaper
 *     description: Update the publish date of an existing e-newspaper. Requires editor role.
 *     tags: [E-Newspapers (Admin)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the e-newspaper to update
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ENewspaperUpdate'
 *     responses:
 *       200:
 *         description: E-newspaper updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ENewspaper'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put("/:id", verifyToken, isEditor, updateENewspaper);
/**
 * @swagger
 * /api/news/e-newspaper/{id}:
 *   delete:
 *     summary: Delete an e-newspaper
 *     description: Delete an e-newspaper and remove its file from storage. Requires editor role.
 *     tags: [E-Newspapers (Admin)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the e-newspaper to delete
 *         example: 1
 *     responses:
 *       200:
 *         description: E-newspaper deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "E-Newspaper deleted successfully"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete("/:id", verifyToken, isEditor, deleteENewspaper);

module.exports = router;
