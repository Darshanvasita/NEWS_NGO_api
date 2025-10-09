const { User, ENewspaper } = require("../models");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../services/email.service");

const inviteUser = async (req, res) => {
  const { email, role } = req.body;
  const inviterId = req.user.id;

  // Validate role
  if (!["editor", "reporter"].includes(role)) {
    return res.status(400).json({
      message: "Invalid role. Can only invite 'editor' or 'reporter'.",
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "A user with this email already exists." });
    }

    // Create user with pending status
    const user = await User.create({
      email,
      role,
      status: "pending",
      invitedBy: inviterId,
    });

    // Create a special invitation token
    const invitationToken = jwt.sign(
      { userId: user.id, type: "invite" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // Invite valid for 7 days
    );

    const inviteLink = `${req.protocol}://${req.get(
      "host"
    )}/api/auth/accept-invite/${invitationToken}`;

    // Send email to the user with the invite link
    const emailSubject = "You have been invited to join our platform";
    const emailText = `Hello,
    
You have been invited to join our platform as a ${role}. Please click on the link below to accept the invitation:

${inviteLink}

This link will expire in 7 days.

Best regards,
The Team`;

    const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation to News NGO</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #ddd;
    }
    .header h1 {
      margin: 0;
      color: #2c3e50;
    }
    .content {
      padding: 20px 0;
    }
    .content p {
      margin: 0 0 15px;
    }
    .button-container {
      text-align: center;
      padding: 20px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #3498db;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to News NGO</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>You have been invited to join News NGO as a <strong>${role}</strong>.</p>
      <p>To accept the invitation and set up your account, please click the button below:</p>
    </div>
    <div class="button-container">
      <a href="${inviteLink}" class="button">Accept Invitation</a>
    </div>
    <div class="content">
      <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
      <p><a href="${inviteLink}">${inviteLink}</a></p>
    </div>
    <div class="footer">
      <p>&copy; 2025 News NGO. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    const emailResult = await sendEmail(
      email,
      emailSubject,
      emailText,
      emailHtml
    );

    if (!emailResult.success) {
      console.error("Failed to send invitation email:", emailResult.error);
      // We don't return an error here as the user was still created successfully
    }

    res.status(201).json({
      message: `Invite sent successfully to ${email}.`,
      inviteLink:
        process.env.NODE_ENV === "development" ? inviteLink : undefined,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

const resendInvite = async (req, res) => {
  const { email } = req.body;
  const inviterId = req.user.id;

  try {
    // Find the pending user
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    if (user.status !== "pending") {
      return res
        .status(400)
        .json({ message: "User is already active or not in pending state." });
    }

    // Create a new invitation token
    const invitationToken = jwt.sign(
      { userId: user.id, type: "invite" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" } // Invite valid for 7 days
    );

    const inviteLink = `${req.protocol}://${req.get(
      "host"
    )}/api/auth/accept-invite/${invitationToken}`;

    // Send email to the user with the invite link
    const emailSubject = "Invitation Reminder - Join our platform";
    const emailText = `Hello,
    
This is a reminder that you have been invited to join our platform as a ${user.role}. Please click on the link below to accept the invitation:

${inviteLink}

This link will expire in 7 days.

Best regards,
The Team`;

    const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation Reminder - News NGO</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #ddd;
    }
    .header h1 {
      margin: 0;
      color: #2c3e50;
    }
    .content {
      padding: 20px 0;
    }
    .content p {
      margin: 0 0 15px;
    }
    .button-container {
      text-align: center;
      padding: 20px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #e67e22;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 5px;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Invitation Reminder</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>This is a reminder that you have been invited to join News NGO as a <strong>${user.role}</strong>.</p>
      <p>To accept the invitation and set up your account, please click the button below:</p>
    </div>
    <div class="button-container">
      <a href="${inviteLink}" class="button">Accept Invitation</a>
    </div>
    <div class="content">
      <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
      <p><a href="${inviteLink}">${inviteLink}</a></p>
    </div>
    <div class="footer">
      <p>&copy; 2025 News NGO. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    const emailResult = await sendEmail(
      email,
      emailSubject,
      emailText,
      emailHtml
    );

    if (!emailResult.success) {
      console.error("Failed to resend invitation email:", emailResult.error);
      // We don't return an error here as the operation was still successful
    }

    res.status(200).json({
      message: `Invitation resent successfully to ${email}.`,
      inviteLink:
        process.env.NODE_ENV === "development" ? inviteLink : undefined,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.findAll({
      where: { status: "pending" },
      attributes: ["id", "email", "role", "createdAt"],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      pendingUsers,
      count: pendingUsers.length,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

const uploadENewspaper = async (req, res) => {
  const { title, publishDate, publishTime } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: "PDF file is required." });
  }

  try {
    const enewspaper = await ENewspaper.create({
      title,
      publishDate,
      publishTime,
      pdfPath: req.file.path, // Assuming Cloudinary provides a path
      isPublished: false,
      userId: req.user.id,
    });

    res.status(201).json({
      message: "E-Newspaper uploaded and scheduled for publishing.",
      enewspaper,
    });
  } catch (error) {
    console.error("E-Newspaper upload error:", error);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

module.exports = {
  inviteUser,
  resendInvite,
  getPendingUsers,
  uploadENewspaper,
};
