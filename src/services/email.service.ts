// services/EmailService.ts
import nodemailer from 'nodemailer';
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL } from '../config/env.ts';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT!),
    secure: false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  static async sendPasswordOTP(email: string, otp: string, username: string) {
    const mailOptions = {
      from: FROM_EMAIL,
      to: email,
      subject: 'Password Change OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Change Request</h2>
          <p>Hello ${username},</p>
          <p>You have requested to change your password. Please use the following OTP to verify your identity:</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          
          <p><strong>This OTP will expire in 5 minutes.</strong></p>
          
          <p>If you didn't request this password change, please ignore this email or contact support if you have concerns.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`OTP email sent to ${email}`);
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  static async sendPasswordChangeConfirmation(email: string, username: string) {
    const mailOptions = {
      from: FROM_EMAIL,
      to: email,
      subject: 'Password Changed Successfully',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Password Changed Successfully</h2>
          <p>Hello ${username},</p>
          <p>Your password has been successfully changed.</p>
          
          <p>If you didn't make this change, please contact our support team immediately.</p>
          
          <div style="background-color: #f0f9ff; padding: 15px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <p style="margin: 0;"><strong>Security Tip:</strong> Keep your password secure and don't share it with anyone.</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message, please do not reply to this email.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Password change confirmation sent to ${email}`);
    } catch (error) {
      console.error('Error sending confirmation email:', error);
      // Don't throw error here as password change was successful
    }
  }
}