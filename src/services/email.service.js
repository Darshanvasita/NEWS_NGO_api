const nodemailer = require("nodemailer");

// Create a transporter object using the default SMTP transport
let transporter = null;
let isVerified = false;

const initializeTransporter = async () => {
  if (transporter && isVerified) return transporter;

  const emailService = process.env.EMAIL_SERVICE || "gmail";
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT;

  // Check if email configuration exists
  if (!emailUser || !emailPass) {
    console.warn(
      "❌ Email configuration is incomplete. Please set EMAIL_USER and EMAIL_PASS in config.env"
    );
    return null;
  }

  try {
    // Configure transporter based on service or custom SMTP
    const transportConfig = emailHost
      ? {
          host: emailHost,
          port: parseInt(emailPort) || 587,
          secure: emailPort === "465", // true for 465, false for other ports
          auth: {
            user: emailUser,
            pass: emailPass,
          },
          // Additional security options
          tls: {
            rejectUnauthorized: false,
          },
        }
      : {
          service: emailService,
          auth: {
            user: emailUser,
            pass: emailPass,
          },
        };

    transporter = nodemailer.createTransport(transportConfig);

    // Verify the configuration asynchronously
    try {
      await transporter.verify();
      isVerified = true;
      console.log("✅ Email configuration verified successfully.");
    } catch (verifyError) {
      console.error("❌ Failed to verify email configuration:", {
        errorCode: verifyError.code,
        errorMessage: verifyError.message,
        host: transporter.options.host || emailService,
        port: transporter.options.port,
        user: emailUser,
      });
      isVerified = false;
    }

    return transporter;
  } catch (error) {
    console.error("❌ Failed to initialize email transporter:", error.message);
    transporter = null;
    isVerified = false;
    return null;
  }
};

// Function to send email with better error handling and validation
const sendEmail = async (to, subject, text, html, attachments = []) => {
  // Validate input parameters
  if (!to || !subject) {
    return {
      success: false,
      message: "Missing required parameters: 'to' and 'subject' are required",
    };
  }

  // Initialize transporter if not already done
  const emailTransporter = await initializeTransporter();

  if (!emailTransporter) {
    console.warn("⚠️ Email service not configured. Skipping email send.");
    return { success: false, message: "Email service not configured" };
  }

  try {
    // Define email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      text,
      html,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    // Send email
    const info = await emailTransporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", {
      messageId: info.messageId,
      to: mailOptions.to,
      subject: subject,
    });

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  } catch (error) {
    console.error("❌ Error sending email:", {
      error: error.message,
      code: error.code,
      to: to,
      subject: subject,
    });

    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
};

// Send welcome email template
const sendWelcomeEmail = async (userEmail, userName) => {
  const subject = "Welcome to Our Platform!";
  const text = `Hello ${userName},\n\nWelcome to our platform! We're excited to have you on board.\n\nBest regards,\nThe Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to Our Platform!</h2>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Welcome to our platform! We're excited to have you on board.</p>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Best regards,<br>The Team</p>
    </div>
  `;

  return await sendEmail(userEmail, subject, text, html);
};

// Send password reset email template
const sendPasswordResetEmail = async (userEmail, resetToken, resetUrl) => {
  const subject = "Password Reset Request";
  const text = `You requested a password reset. Click the following link to reset your password: ${resetUrl}?token=${resetToken}\n\nIf you didn't request this, please ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p>You requested a password reset for your account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}?token=${resetToken}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p><strong>This link will expire in 1 hour.</strong></p>
      <p>If you didn't request this password reset, please ignore this email.</p>
      <p>Best regards,<br>The Team</p>
    </div>
  `;

  return await sendEmail(userEmail, subject, text, html);
};

// Test the email configuration
const testEmailConfiguration = async () => {
  const emailTransporter = await initializeTransporter();
  if (emailTransporter && isVerified) {
    console.log("✅ Email service is ready to use.");
    return { success: true, message: "Email configuration is valid" };
  } else {
    console.error("❌ Email service is not properly configured.");
    return { success: false, message: "Email configuration failed" };
  }
};

// Reset transporter (useful for config changes)
const resetTransporter = () => {
  transporter = null;
  isVerified = false;
  console.log("🔄 Email transporter reset. Will reinitialize on next use.");
};

module.exports = {
  initializeTransporter,
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  testEmailConfiguration,
  resetTransporter,
};
