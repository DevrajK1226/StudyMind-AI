import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  if (!transporter) {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_APP_PASSWORD;

    if (!user || !pass) {
      throw new Error(
        "EMAIL_USER and EMAIL_APP_PASSWORD must be set in environment variables"
      );
    }

    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user, pass },
    });
  }
  return transporter;
}

export function generateVerificationCode() {
  // 6-digit numeric code, e.g. "042913"
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(toEmail, name, code) {
  const mailOptions = {
    from: `"StudyMind AI" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Verify your StudyMind AI account",
    text:
      `Hi ${name},\n\n` +
      `Your verification code is: ${code}\n\n` +
      `This code expires in 10 minutes. Enter it on the sign-up page to activate your account.\n\n` +
      `If you didn't create this account, you can ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Verify your StudyMind AI account</h2>
        <p>Hi ${name},</p>
        <p>Your verification code is:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #4353ff;">${code}</p>
        <p>This code expires in 10 minutes.</p>
        <p style="color: #888; font-size: 13px;">If you didn't create this account, you can ignore this email.</p>
      </div>
    `,
  };

  await getTransporter().sendMail(mailOptions);
}