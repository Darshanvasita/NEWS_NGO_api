const { User } = require('../models');
const jwt = require('jsonwebtoken');

const inviteUser = async (req, res) => {
  const { email, role } = req.body;
  const inviterId = req.user.id;

  // Validate role
  if (!['editor', 'reporter'].includes(role)) {
    return res.status(400).json({ message: "Invalid role. Can only invite 'editor' or 'reporter'." });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    // Create user with pending status
    const user = await User.create({
      email,
      role,
      status: 'pending',
      invitedBy: inviterId,
    });

    // Create a special invitation token
    const invitationToken = jwt.sign(
      { userId: user.id, type: 'invite' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Invite valid for 7 days
    );

    const inviteLink = `${req.protocol}://${req.get('host')}/api/auth/accept-invite/${invitationToken}`;

    // TODO: Send email to the user with the invite link
    // For now, we will log it and return it in the response for development
    console.log(`Invite link for ${email}: ${inviteLink}`);

    res.status(201).json({ message: `Invite sent successfully to ${email}.`, inviteLink });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

module.exports = {
  inviteUser,
};
