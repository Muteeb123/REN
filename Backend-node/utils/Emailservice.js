import { Resend } from "resend";

// -------------------------------
// RESEND CLIENT
// -------------------------------
const resend = new Resend(process.env.RESEND_API_KEY);

// -------------------------------
// MAIN EMAIL FUNCTION
// -------------------------------
export const sendHelpProviderCredentials = async (toEmail, password) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("Missing RESEND_API_KEY environment variable");
  }

  try {
    const result = await resend.emails.send({
      from: "onboarding@resend.dev", // you can change later
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
    });

    console.log("[EmailService] Email sent successfully:", result?.data?.id);
    return result;
  } catch (error) {
    console.error("[EmailService] Email send failed:", error);
    throw error;
  }
};