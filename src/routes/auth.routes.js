const express = require('express');
const { register, login, acceptInvite, logout } = require('../controllers/auth.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and user management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new standard user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: strongpassword123
 *     responses:
 *       '201':
 *         description: User created successfully
 *       '400':
 *         description: User already exists
 *       '500':
 *         description: Something went wrong
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in an existing user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: strongpassword123
 *     responses:
 *       '200':
 *         description: Login successful, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 userId:
 *                   type: integer
 *                 role:
 *                   type: string
 *       '400':
 *         description: Invalid credentials
 *       '403':
 *         description: User account is not active
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Something went wrong
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/accept-invite/{token}:
 *   post:
 *     summary: Accept an invitation and activate an account
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The invitation token from the invite link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Doe
 *               password:
 *                 type: string
 *                 format: password
 *                 example: newstrongpassword123
 *     responses:
 *       '200':
 *         description: Account activated successfully, returns new session token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *       '400':
 *         description: Invalid invitation or user already active
 *       '401':
 *         description: Invalid or expired invitation link
 *       '500':
 *         description: Something went wrong
 */
router.post('/accept-invite/:token', acceptInvite);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logs out the current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Logout successful
 *       '401':
 *         description: Not authorized
 */
router.post('/logout', logout);

module.exports = router;
