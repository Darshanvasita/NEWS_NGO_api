const nodemailer = require("nodemailer");
const config = require("../config/config");

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465, // true for 465, false for other ports
  auth: {
    user: config.email.auth.user,
    pass: config.email.auth.pass,
  },
  tls: {
    rejectUnauthorized: false // This helps with self-signed certificates
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: config.email.from,
      to,
      subject,
      html,
    };
    
    console.log('Sending email with config:', {
      host: config.email.host,
      port: config.email.port,
      user: config.email.auth.user,
      from: config.email.from,
      to: to
    });
    
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Error sending email:', {
      error: error.message,
      code: error.code,
      hostname: error.hostname,
      to: to,
      subject: subject
    });
    throw error;
  }
};

// Test email configuration
const testEmailConfig = async () => {
  // Quick check for placeholder password
  if (config.email.auth.pass === 'PUT_YOUR_16_CHARACTER_APP_PASSWORD_HERE') {
    console.error('FATAL ERROR: Email password is a placeholder.');
    console.error('Please generate a 16-character App Password for Gmail and update it in your config.env file.');
    console.error('Follow these steps:');
    console.error('1. Go to https://myaccount.google.com/');
    console.error('2. Navigate to Security → 2-Step Verification (must be ON).');
    console.error('3. Go to App passwords → Generate a new password for "Mail" on your device.');
    console.error('4. Copy the 16-character password (without spaces) and set it as EMAIL_PASS in your config.env.');
    return false;
  }

  try {
    await transporter.verify();
    console.log('Email configuration is valid and server is ready to send emails.');
    return true;
  } catch (error) {
    console.error('Failed to verify email configuration. Please check your credentials and settings.', {
      errorCode: error.code,
      errorMessage: error.message,
      host: config.email.host,
      port: config.email.port,
      user: config.email.auth.user
    });

    if (error.code === 'EAUTH') {
      console.error('Authentication error: Invalid username or password. Ensure you are using a 16-character App Password.');
    }

    return false;
  }
};

module.exports = {
  sendEmail,
  testEmailConfig,
};