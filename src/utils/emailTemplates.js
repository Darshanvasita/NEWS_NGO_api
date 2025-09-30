const getInviteEmailTemplate = (role, inviteLink) => {
  return `
    <!DOCTYPE html>
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
          <p>&copy; 2024 News NGO. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  getInviteEmailTemplate,
};