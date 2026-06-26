import nodemailer from 'nodemailer';
import { env } from '../config/env';

let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  } else {
    // Fallback to Ethereal if no SMTP credentials are provided (for development)
    console.warn('⚠️ No SMTP configuration found. Falling back to Ethereal Mail for testing.');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return transporter;
}

export async function sendOtpEmail(to: string, otp: string) {
  const t = await getTransporter();

  const mailOptions = {
    from: `"Neptune Planters" <${env.SMTP_USER || 'no-reply@neptuneplanters.com'}>`,
    to,
    subject: 'Your Password Reset OTP',
    text: `You requested a password reset. Your OTP is: ${otp}\n\nIt is valid for 10 minutes.`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>You recently requested to reset your password. Use the OTP below to proceed:</p>
        <div style="background: #f4f4f4; padding: 16px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; border-radius: 8px;">
          ${otp}
        </div>
        <p style="margin-top: 16px; color: #555;">This OTP is valid for 10 minutes. If you did not request a password reset, please ignore this email.</p>
      </div>
    `,
  };

  const info = await t.sendMail(mailOptions);
  
  if (!env.SMTP_HOST) {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } else {
    console.log(`Email sent to ${to}`);
  }
}
