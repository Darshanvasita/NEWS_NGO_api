const nodemailer = require('nodemailer');

// Create a transporter object using the default SMTP transport
let transporter;

const initializeTransporter = () => {
  if (transporter) return transporter;

  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  // Check if email configuration exists
  if (!emailUser || !emailPass) {
    console.warn('❌ Email configuration is incomplete. Please set EMAIL_USER and EMAIL_PASS in config.env');
    return null;
  }

  try {
    transporter = nodemailer.createTransport({
      service: emailService,
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    // Verify the configuration
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Failed to verify email configuration:', {
          errorCode: error.code,
          errorMessage: error.message,
          host: transporter.options.host,
          port: transporter.options.port,
          user: emailUser
        });
        console.error('🔑 AUTHENTICATION ERROR:', error.message);
        console.error('   • Ensure 2-Factor Authentication is enabled');
        console.error('   • Generate NEW App Password (old ones may expire)');
        console.error('   • Remove ALL spaces from the password');
        console.error('   • Use App Password, NOT regular Gmail password');
        console.warn('⚠  Email configuration is invalid. Server will start but email features may not work.');
        console.warn('To fix: Update EMAIL_PASS in config.env with a valid Gmail App Password');
      } else {
        console.log('✅ Email configuration verified successfully.');
      }
    });

    return transporter;
  } catch (error) {
    console.error('❌ Failed to initialize email transporter:', error.message);
    return null;
  }
};

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  // Initialize transporter if not already done
  const transporter = initializeTransporter();
  
  if (!transporter) {
    console.warn('⚠  Email service not configured. Skipping email send.');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    // Define email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      text,
      html
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return { success: false, error: error.message };
  }
};

// Test the email configuration on startup
const testEmailConfiguration = async () => {
  const transporter = initializeTransporter();
  if (transporter) {
    try {
      // Just verify the connection
      await transporter.verify();
      console.log('✅ Email configuration verified successfully.');
    } catch (error) {
      console.error('❌ Failed to verify email configuration:', error.message);
    }
  }
};

module.exports = {
  initializeTransporter,
  sendEmail,
  testEmailConfiguration
};