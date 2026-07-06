const RESEND_API_URL = "https://api.resend.com/emails";

export function generateVerificationCode() {
  // 6-digit numeric code, e.g. "042913"
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(toEmail, name, code) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY must be set in environment variables");
  }

  const payload = {
    from: "StudyMind AI <onboarding@resend.dev>",
    to: [toEmail],
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

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend API error (${response.status}): ${errorBody}`);
  }
}
