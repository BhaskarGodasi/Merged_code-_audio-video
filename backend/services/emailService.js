const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Check if credentials exist
const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
const emailPass =
  process.env.EMAIL_APP_PASSWORD ||
  process.env.SMTP_PASS ||
  process.env.GMAIL_APP_PASSWORD;

if (!emailUser || !emailPass) {
  console.warn("⚠️ Email credentials not found in environment variables");
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

const verifyEmailConfig = async () => {
  if (!emailUser || !emailPass) {
    console.error("❌ Email configuration error: Missing credentials");
    return false;
  }

  try {
    await transporter.verify();
    console.log("✅ Email configuration verified successfully");
    return true;
  } catch (error) {
    console.error("❌ Email configuration error:", error.message);
    return false;
  }
};

const sendEmail = async (to, subject, text, html = null) => {
  if (!emailUser || !emailPass) {
    return { success: false, error: "Email service not configured" };
  }

  if (!to) {
    return { success: false, error: "No recipients defined" };
  }

  try {
    const mailOptions = {
      from: `"LED Display System" <${emailUser}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text,
      html: html || text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully to:", to);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  verifyEmailConfig,
  sendEmail,
};
