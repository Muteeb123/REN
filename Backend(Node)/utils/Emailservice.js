import nodemailer from "nodemailer";
import { google } from "googleapis";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER, // Your Gmail address
        pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password (not your regular password)
    },
});


export const sendHelpProviderCredentials = async (toEmail, password) => {
    console.log("google auth details:", {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    });
    const mailOptions = {
        from:`${process.env.GMAIL_USER}`,
        to: toEmail,
        subject: "Your Help Provider Account Credentials",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333;">Welcome as a Help Provider!</h2>-
        <p>An account has been created for you. Use the credentials below to log in:</p>
        <div style="background: #f5f5f5; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Email:</strong> ${toEmail}</p>
          <p style="margin: 8px 0 0;"><strong>Password:</strong> ${password}</p>
        </div>
        <p style="color: #888; font-size: 13px;">Please keep your credentials safe.</p>
      </div>
    `,
    };
    console.log("Sending email with options:", mailOptions);

    await transporter.sendMail(mailOptions);
};