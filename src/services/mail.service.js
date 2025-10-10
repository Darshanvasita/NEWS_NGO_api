const nodemailer = require("nodemailer");

// Use the same transporter configuration as in email.service.js
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify your Email for Newsletter Subscription",
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Newsletter Subscription Verification</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; }
        .otp { font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 30px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Newsletter Subscription Verification</h2>
        </div>
        <p>Hello,</p>
        <p>Thank you for subscribing to our newsletter. Please use the following OTP to verify your email address:</p>
        <div class="otp">${otp}</div>
        <p>This OTP is valid for 5 minutes. If you didn't request this subscription, please ignore this email.</p>
        <div class="footer">
          <p>&copy; 2025 News NGO. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>`,
  };

  await transporter.sendMail(mailOptions);
};

const sendWelcomeEmail = async (email) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Welcome to Our Newsletter! 🎉",
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Our Newsletter</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Welcome to Our Newsletter!</h2>
        </div>
        <p>Hello,</p>
        <p>You have been successfully subscribed to our newsletter. You'll now receive our latest news and updates directly in your inbox.</p>
        <p>If you have any questions or need assistance, feel free to reach out to us.</p>
        <p>Best regards,<br><strong>The News NGO Team</strong></p>
        <div class="footer">
          <p>&copy; 2025 News NGO. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>`,
  };

  await transporter.sendMail(mailOptions);
};

const sendNewsletterEmail = async (email, newsItems) => {
  const newsListHtml = newsItems
    .map(
      (item) =>
        `<li style="margin-bottom: 15px;">
          <h3><a href="${item.link}" style="color: #1a73e8; text-decoration: none;">${item.title}</a></h3>
          <p>${item.description}</p>
        </li>`
    )
    .join("");

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "📰 Weekly Highlights from News NGO",
    html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Weekly Newsletter</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Weekly Highlights</h2>
        </div>
        <p>Hello,</p>
        <p>Here are this week's top stories:</p>
        
        <ul style="list-style-type: none; padding: 0;">
          ${newsListHtml}
        </ul>
        
        <p>Stay tuned for more updates next week!</p>
        
        <hr>
        
        <p style="font-size: 12px; color: #777;">
          <a href="${process.env.APP_URL || 'http://localhost:3000'}/api/subscribe/unsubscribe?email=${email}">Unsubscribe</a> from this newsletter.
        </p>
        
        <div class="footer">
          <p>&copy; 2025 News NGO. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendOtpEmail,
  sendWelcomeEmail,
  sendNewsletterEmail,
};