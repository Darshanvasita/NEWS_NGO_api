const nodemailer = require("nodemailer");

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
    subject: "Verify your Email ",
    html: `<table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center">
              <img src="https://yourdomain.com/logo.png" alt="Brand Logo" width="150">
            </td>
          </tr>
          <tr>
            <td>
              <h2>Verify Your Subscription</h2>
              <p>Hi ,</p>
              <p>Use the OTP below to verify your subscription. This OTP is valid for 10 minutes.</p>
              <p align="center" style="font-size:24px; font-weight:bold;">${otp}</p>
              <p>If you did not request this, please ignore this email.</p>
             
            </td>
          </tr>
          <tr>
            <td align="center">© 2025 [Your Company]. All rights reserved.</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendWelcomeEmail = async (email) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Welcome to Our Newsletter! 🎉",
    html: `
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e6e9ee; border-radius:8px;">
          <!-- Header / Brand Logo -->
          <tr>
            <td align="center" style="padding:20px;">
              <img src="https://yourdomain.com/logo.png" alt="Brand Logo" width="150">
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:20px; font-family: Arial, sans-serif; font-size:15px; line-height:1.5;">
              <h2>Welcome to [Your Company Name]!</h2>
              <p>Hi <strong>[User Name]</strong>,</p>
              <p>We’re excited to have you on board! Thank you for joining <strong>[Your Company Name]</strong>. You now have access to our platform and all its features.</p>
              <p>To get started, please verify your email or complete your profile using the button below:</p>
              <p align="center">
                <a href="[Verification Link]" style="display:inline-block; padding:12px 20px; background:#1a73e8; color:#fff; text-decoration:none; border-radius:6px;">Get Started</a>
              </p>
              <p>If you have any questions, feel free to reply to this email. We’re here to help!</p>
              <p>Welcome aboard,<br><strong>The [Your Company Name] Team</strong></p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:16px; font-size:12px; color:#8b9096;">
              © 2025 [Your Company]. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const sendNewsletterEmail = async (email, newsItems) => {
  const newsListHtml = newsItems
    .map(
      (item) =>
        `<li><a href="${item.link}">${item.title}</a>: ${item.description}</li>`
    )
    .join("");

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "📰 Weekly Highlights from Your News Site",
    html: `
       <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e6e9ee; border-radius:8px;">
          
          <!-- Header / Brand Logo -->
          <tr>
            <td align="center" style="padding:20px;">
              <img src="https://yourdomain.com/logo.png" alt="Brand Logo" width="150">
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:20px; font-family: Arial, sans-serif; font-size:15px; line-height:1.5;">
              <p>Hey there,</p>
              <p>Here are this week's top stories:</p>
              
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <ul>
                      ${newsListHtml}
                    </ul>
                  </td>
                </tr>
              </table>
              
              <p>Stay tuned for more updates next week!</p>
              
              <hr>
              
              <p><small>To unsubscribe, <a href="${process.env.APP_URL}/api/unsubscribe?email=${email}">click here</a>.</small></p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:16px; font-size:12px; color:#8b9096;">
              © 2025 [Your Company]. All rights reserved.
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendOtpEmail,
  sendWelcomeEmail,
  sendNewsletterEmail,
};
