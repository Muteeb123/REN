import nodemailer from "nodemailer";
import dns from "dns";

// 🔥 FORCE IPv4 (fixes Railway ENETUNREACH IPv6 issue)
dns.setDefaultResultOrder("ipv4first");

// -------------------------------
// SMTP TRANSPORTER (Gmail)
// -------------------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  pool: true, // improves stability under load
  maxConnections: 3,
  maxMessages: 10,
});

// -------------------------------
// VERIFY CONNECTION ON START
// -------------------------------
transporter.verify((error, success) => {
  if (error) {
    console.error("[EmailService] SMTP connection failed:", error);
  } else {
    console.log("[EmailService] SMTP server is ready");
  }
});

// -------------------------------
// RETRY HELPER
// -------------------------------
const sendWithRetry = async (mailOptions, retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await transporter.sendMail(mailOptions);
    } catch (err) {
      console.error(
        `[EmailService] Attempt ${attempt} failed:`,
        err?.message || err
      );

      if (attempt === retries) throw err;

      // wait before retry
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
};

// -------------------------------
// MAIN EMAIL FUNCTION
// -------------------------------
export const sendHelpProviderCredentials = async (toEmail, password) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error("Missing Gmail environment variables");
  }

  const mailOptions = {
    from: `REN App <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Your Help Provider Account Credentials",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333;">Welcome as a Help Provider!</h2>
        <p>An account has been created for you. Use the credentials below to log in:</p>

        <div style="background: #f5f5f5; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Email:</strong> ${toEmail}</p>
          <p style="margin: 8px 0 0;"><strong>Password:</strong> ${password}</p>
        </div>

        <p style="color: #888; font-size: 13px;">
          Please keep your credentials safe.
        </p>
      </div>
    `,
  };

  try {
    const result = await sendWithRetry(mailOptions);
    console.log("[EmailService] Email sent successfully:", result.messageId);
    return result;
  } catch (error) {
    console.error("[EmailService] FINAL FAILURE:", error);
    throw error;
  }
};