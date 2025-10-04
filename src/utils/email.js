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
  try {
    await transporter.verify();
    console.log('Email configuration is valid and server is ready');
    return true;
  } catch (error) {
    console.error('Email configuration error:', {
      error: error.message,
      code: error.code,
      hostname: error.hostname,
      host: config.email.host,
      port: config.email.port,
      user: config.email.auth.user
    });
    return false;
  }
};

module.exports = {
  sendEmail,
  testEmailConfig,
};