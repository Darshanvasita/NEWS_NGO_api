const express = require("express");
const {
  inviteUser,
  resendInvite,
  getPendingUsers,
  uploadENewspaper,
} = require("../controllers/admin.controller");
const { verifyToken, isAdmin } = require("../middlewares/auth.middleware");
const upload = require("../config/cloudinary");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administrator-specific operations
 */

/**
 * @swagger
 * /api/admin/invite:
 *   post:
 *     summary: Invite a new user as an Editor or Reporter
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: new.reporter@example.com
 *               role:
 *                 type: string
 *                 enum: [editor, reporter]
 *                 example: reporter
 *     responses:
 *       '201':
 *         description: Invite sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 inviteLink:
 *                   type: string
 *       '400':
 *         description: Invalid role or user already exists
 *       '401':
 *         description: Not authorized, token failed
 *       '403':
 *         description: Access denied. Admin role required.
 *       '500':
 *         description: Something went wrong
 */
router.post("/invite", verifyToken, isAdmin, inviteUser);

/**
 * @swagger
 * /api/admin/resend-invite:
 *   post:
 *     summary: Resend invitation to a pending user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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
 *                 example: pending.user@example.com
 *     responses:
 *       '200':
 *         description: Invite resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 inviteLink:
 *                   type: string
 *       '400':
 *         description: User not found or already active
 *       '401':
 *         description: Not authorized, token failed
 *       '403':
 *         description: Access denied. Admin role required.
 *       '500':
 *         description: Something went wrong
 */
router.post("/resend-invite", verifyToken, isAdmin, resendInvite);

/**
 * @swagger
 * /api/admin/pending-users:
 *   get:
 *     summary: Get list of pending users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of pending users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pendingUsers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *       '401':
 *         description: Not authorized, token failed
 *       '403':
 *         description: Access denied. Admin role required.
 *       '500':
 *         description: Something went wrong
 */
router.get("/pending-users", verifyToken, isAdmin, getPendingUsers);

/**
 * @swagger
 * /api/admin/enewspaper:
 *   post:
 *     summary: Upload an e-newspaper
 *     tags: [Admin]
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
 *               - publishDate
 *               - publishTime
 *               - pdf
 *             properties:
 *               title:
 *                 type: string
 *               publishDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               publishTime:
 *                 type: string
 *                 format: time
 *                 example: "18:00:00"
 *               pdf:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '201':
 *         description: E-Newspaper uploaded successfully
 *       '400':
 *         description: Bad request
 *       '403':
 *         description: Access denied
 */
router.post(
  "/enewspaper",
  verifyToken,
  isAdmin,
  upload.single("pdf"),
  uploadENewspaper
);

module.exports = router;
