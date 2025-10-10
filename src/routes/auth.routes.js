const express = require("express");
const {
  register,
  login,
  acceptInvite,
  logout,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");
const { validate, sanitize, validationRules } = require('../middlewares/validation.middleware');
const { authLimiter } = require('../middlewares/rateLimiter');
const { xssProtection, rateLimitByIP, resetFailedAttempts } = require('../middlewares/security.middleware');

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
router.post("/register", authLimiter, sanitize, validationRules.user.register, validate, register);

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
router.post("/login", authLimiter, xssProtection, rateLimitByIP, sanitize, validationRules.user.login, validate, login);

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
router.post("/accept-invite/:token", authLimiter, sanitize, acceptInvite);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
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
 *                 example: user@example.com
 *     responses:
 *       '200':
 *         description: Password reset email sent
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Something went wrong
 */
router.post("/forgot-password", authLimiter, sanitize, forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The password reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 example: newpassword123
 *     responses:
 *       '200':
 *         description: Password reset successful
 *       '400':
 *         description: Invalid or expired token
 *       '500':
 *         description: Something went wrong
 */
router.post("/reset-password/:token", authLimiter, sanitize, resetPassword);

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
router.post("/logout", logout);

module.exports = router;
