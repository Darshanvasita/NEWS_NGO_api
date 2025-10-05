const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify your Subscription (OTP Inside)",
    html: `
      <p>Your OTP for subscription is <strong>${otp}</strong>.</p>
      <p>It will expire in 5 minutes.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendWelcomeEmail = async (email) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Welcome to Our Newsletter! 🎉",
    html: `
      <p>Hi there,</p>
      <p>Thanks for subscribing to our newsletter!</p>
      <p>You'll now get weekly updates straight to your inbox.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendNewsletterEmail = async (email, newsItems) => {
  const newsListHtml = newsItems
    .map(
      (item) => `<li><a href="${item.link}">${item.title}</a>: ${item.description}</li>`
    )
    .join('');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '📰 Weekly Highlights from Your News Site',
    html: `
      <p>Hey there,</p>
      <p>Here are this week's top stories:</p>
      <ul>
        ${newsListHtml}
      </ul>
      <p>Stay tuned for more updates next week!</p>
      <hr>
      <p><small>To unsubscribe, <a href="${process.env.APP_URL}/api/unsubscribe?email=${email}">click here</a>.</small></p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendOtpEmail,
  sendWelcomeEmail,
  sendNewsletterEmail,
};