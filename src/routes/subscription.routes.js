const express = require('express');
const { createSubscription } = require('../controllers/subscription.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Subscription
 *   description: Subscription management
 */

/**
 * @swagger
 * /api/subscribe:
 *   post:
 *     summary: Subscribe to the newsletter
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
 *                 description: The email address to subscribe.
 *     responses:
 *       '201':
 *         description: Subscription successful
 *       '400':
 *         description: Bad request (e.g., missing email, invalid format)
 *       '409':
 *         description: This email is already subscribed
 */
router.post('/', createSubscription);

module.exports = router;