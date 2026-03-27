const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"AstroPlanets" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

const sendOTPEmail = async (email, otp, fullName) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #dc2626, #ea580c); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">AstroPlanets</h1>
      </div>
      <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <h2>Hello ${fullName},</h2>
        <p>You requested to reset your password. Use the following OTP to proceed:</p>
        <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This OTP is valid for <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 12px;">© 2024 AstroPlanets. All rights reserved.</p>
      </div>
    </div>
  `;

  await sendEmail({
    email,
    subject: 'Password Reset OTP - AstroPlanets',
    message: `Your OTP for password reset is: ${otp}. Valid for 10 minutes.`,
    html,
  });
};

module.exports = { sendEmail, sendOTPEmail };