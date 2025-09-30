const { User } = require('../models');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/email');
const { getInviteEmailTemplate } = require('../utils/emailTemplates');
const config =require('../config/config');

const inviteUser = async (req, res) => {
  const { email, role } = req.body;

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
      { userId: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    // Construct the invitation link
    const inviteLink = `${req.protocol}://${req.get('host')}/accept-invite?token=${invitationToken}`;

    // Send the invitation email
    const emailSubject = 'You are invited to News NGO';
    const emailHtml = getInviteEmailTemplate(role, inviteLink);
    await sendEmail(email, emailSubject, emailHtml);

    res.status(200).json({ message: `Invitation sent to ${email}.` });
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ message: 'Failed to send invitation.', error: error.message });
  }
};

module.exports = {
  inviteUser,
};
