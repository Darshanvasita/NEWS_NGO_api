// const express = require("express");
// const {
//   subscribe,
//   verifyOtp,
//   unsubscribe,
// } = require("../controllers/subscription.controller");

// const router = express.Router();

// /**
//  * @swagger
//  * tags:
//  *   name: Subscription
//  *   description: Subscription management
//  */

// /**
//  * @swagger
//  * /api/subscribe:
//  *   post:
//  *     summary: Initiate subscription and send OTP
//  *     tags: [Subscription]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - email
//  *             properties:
//  *               email:
//  *                 type: string
//  *                 format: email
//  *     responses:
//  *       '200':
//  *         description: OTP sent successfully
//  *       '400':
//  *         description: Bad request
//  *       '409':
//  *         description: Email already subscribed
//  */
// router.post("/", subscribe);

// /**
//  * @swagger
//  * /api/subscribe/verify-otp:
//  *   post:
//  *     summary: Verify OTP and complete subscription
//  *     tags: [Subscription]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - email
//  *               - otp
//  *             properties:
//  *               email:
//  *                 type: string
//  *                 format: email
//  *               otp:
//  *                 type: string
//  *     responses:
//  *       '201':
//  *         description: Subscription successful
//  *       '400':
//  *         description: Invalid OTP or expired
//  */
// // router.get("/verify-otp", verifyOtp);
// router.post("/verify-otp", verifyOtp);

// console.log("Subscription routes loaded.");

// /**
//  * @swagger
//  * /api/subscribe/unsubscribe:
//  *   get:
//  *     summary: Unsubscribe from the newsletter
//  *     tags: [Subscription]
//  *     parameters:
//  *       - in: query
//  *         name: email
//  *         schema:
//  *           type: string
//  *         required: true
//  *         description: The email to unsubscribe.
//  *     responses:
//  *       '200':
//  *         description: Unsubscribed successfully
//  *       '400':
//  *         description: Email is required
//  *       '404':
//  *         description: Email not found
//  */
// router.get("/unsubscribe", unsubscribe);

// module.exports = router;
