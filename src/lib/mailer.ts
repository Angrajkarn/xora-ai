
'use server';

import nodemailer from 'nodemailer';

interface MailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

export const sendEmail = async ({ to, subject, text, html }: MailOptions) => {
  // In a real app, you'd use a more robust email service like SendGrid, Resend, or AWS SES.
  // Using Gmail with nodemailer is suitable for development/testing but not production.
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `Xora <${process.env.EMAIL}>`,
    to,
    subject,
    text,
    html,
  });
};
