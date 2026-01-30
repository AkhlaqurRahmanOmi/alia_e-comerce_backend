import { PrismaClient, NotificationChannel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding notification templates...');

  // OTP Email Template
  await prisma.notificationTemplate.upsert({
    where: { name: 'otp-email' },
    update: {},
    create: {
      name: 'otp-email',
      event: 'user.otp.requested',
      channel: NotificationChannel.email,
      subject: 'Verify Your Email - OTP Code',
      template: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #4CAF50; text-align: center; padding: 20px; background-color: #fff; border: 2px dashed #4CAF50; border-radius: 5px; margin: 20px 0; letter-spacing: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Verification</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>Thank you for registering! Please use the following OTP code to verify your email address:</p>

              <div class="otp-code">{{otp}}</div>

              <p>This code will expire in <strong>{{expiryMinutes}} minutes</strong>.</p>

              <div class="warning">
                <strong>Security Notice:</strong> Never share this code with anyone. Our team will never ask for your OTP code.
              </div>

              <p>If you didn't request this code, please ignore this email.</p>

              <p>Best regards,<br>The E-Commerce Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      isActive: true,
    },
  });

  // Welcome Email Template
  await prisma.notificationTemplate.upsert({
    where: { name: 'welcome-email' },
    update: {},
    create: {
      name: 'welcome-email',
      event: 'user.registered',
      channel: NotificationChannel.email,
      subject: 'Welcome to E-Commerce!',
      template: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome, {{name}}!</h1>
            </div>
            <div class="content">
              <p>Hi {{name}},</p>
              <p>Welcome to our E-Commerce platform! We're excited to have you on board.</p>

              <p>You can now:</p>
              <ul>
                <li>Browse our wide selection of products</li>
                <li>Add items to your cart</li>
                <li>Track your orders</li>
                <li>Manage your account</li>
              </ul>

              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="button">Start Shopping</a>
              </p>

              <p>If you have any questions, feel free to reach out to our support team.</p>

              <p>Happy shopping!<br>The E-Commerce Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      isActive: true,
    },
  });

  // Account Verified Email Template
  await prisma.notificationTemplate.upsert({
    where: { name: 'account-verified' },
    update: {},
    create: {
      name: 'account-verified',
      event: 'user.verified',
      channel: NotificationChannel.email,
      subject: 'Account Verified Successfully!',
      template: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .checkmark { font-size: 60px; text-align: center; color: #4CAF50; }
            .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Verified!</h1>
            </div>
            <div class="content">
              <div class="checkmark">✓</div>
              <p>Hi {{name}},</p>
              <p>Congratulations! Your email address has been successfully verified.</p>

              <p>Your account is now fully activated and you can enjoy all the features of our platform.</p>

              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login to Your Account</a>
              </p>

              <p>Thank you for joining us!</p>

              <p>Best regards,<br>The E-Commerce Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      isActive: true,
    },
  });

  // Password Reset Email Template
  await prisma.notificationTemplate.upsert({
    where: { name: 'password-reset' },
    update: {},
    create: {
      name: 'password-reset',
      event: 'user.password.reset.requested',
      channel: NotificationChannel.email,
      subject: 'Password Reset Request',
      template: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #FF9800; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>

              <p style="text-align: center;">
                <a href="{{resetLink}}" class="button">Reset Password</a>
              </p>

              <p>This link will expire in <strong>{{expiryMinutes}} minutes</strong>.</p>

              <div class="warning">
                <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email or contact support if you have concerns.
              </div>

              <p>For security reasons, this link can only be used once.</p>

              <p>Best regards,<br>The E-Commerce Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      isActive: true,
    },
  });

  console.log('✅ Notification templates seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding notification templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
