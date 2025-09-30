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
});

const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: config.email.from,
    to,
    subject,
    html,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendEmail,
};