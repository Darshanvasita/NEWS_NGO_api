const { User } = require('../models');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/email');
const { getInviteEmailTemplate } = require('../utils/emailTemplates');
const config =require('../config/config');

const inviteUser = async (req, res) => {
  const { email, role } = req.body;

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }

  // Validate role
  if (!['editor', 'reporter'].includes(role)) {
    return res.status(400).json({ message: "Invalid role. Can only be 'editor' or 'reporter'." });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists.' });
    }

    // Create a user with a 'pending' status
    const user = await User.create({
      email,
      role,
      status: 'pending',
    });

    // Generate an invitation token
    const invitationToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'invite' },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    // Construct the invitation link
    const inviteLink = `${req.protocol}://${req.get('host')}/api/auth/accept-invite/${invitationToken}`;

    // Send the invitation email
    const emailSubject = 'You are invited to News NGO';
    const emailHtml = getInviteEmailTemplate(role, inviteLink);
    
    try {
      await sendEmail(email, emailSubject, emailHtml);
      console.log(`✅ Invitation email sent successfully to ${email}`);
    } catch (emailError) {
      console.error('❌ Failed to send invitation email:', emailError);
      // Delete the created user if email fails
      await User.destroy({ where: { id: user.id } });
      return res.status(500).json({ 
        message: 'Failed to send invitation email. Please check email configuration.', 
        error: emailError.message 
      });
    }

    res.status(200).json({ message: `Invitation sent to ${email}.` });
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ message: 'Failed to send invitation.', error: error.message });
  }
};

const testEmailConfig = async (req, res) => {
  try {
    const { testEmailConfig: testConfig } = require('../utils/email');
    const isValid = await testConfig();
    
    if (isValid) {
      res.status(200).json({ 
        message: 'Email configuration is valid',
        config: {
          host: config.email.host,
          port: config.email.port,
          user: config.email.auth.user,
          from: config.email.from
        }
      });
    } else {
      res.status(500).json({ message: 'Email configuration is invalid' });
    }
  } catch (error) {
    res.status(500).json({ 
      message: 'Error testing email configuration',
      error: error.message 
    });
  }
};

module.exports = {
  inviteUser,
  testEmailConfig,
};
