const express = require('express');
const { inviteUser } = require('../controllers/admin.controller');
const { verifyToken, isAdmin } = require('../middlewares/auth.middleware');

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
router.post('/invite', verifyToken, isAdmin, inviteUser);

module.exports = router;
