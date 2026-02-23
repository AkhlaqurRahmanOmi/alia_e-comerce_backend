import {
  NotificationChannel,
  PrismaClient,
} from '../../../src/generated/prisma/client';

export async function seedNotificationTemplates(prisma: PrismaClient) {
  console.log('📧 Seeding notification templates...');

  const templates = [
    // Order Confirmation
    {
      name: 'Order Confirmation - Email',
      event: 'order.created',
      channel: NotificationChannel.email,
      subject: 'Order Confirmation - {{orderReference}}',
      template: `
        <h2>Thank you for your order!</h2>
        <p>Hi {{customerName}},</p>
        <p>Your order <strong>{{orderReference}}</strong> has been confirmed.</p>
        <p><strong>Order Details:</strong></p>
        <ul>
          <li>Order Total: {{orderTotal}}</li>
          <li>Estimated Delivery: {{estimatedDelivery}}</li>
        </ul>
        <p>You can track your order status at any time.</p>
        <p>Thank you for shopping with us!</p>
      `,
      isActive: true,
    },
    {
      name: 'Order Confirmation - Realtime',
      event: 'order.created',
      channel: NotificationChannel.realtime,
      subject: 'Order placed successfully',
      template: 'Your order {{orderReference}} has been confirmed. Total: {{orderTotal}}',
      isActive: true,
    },

    // Order Status Update
    {
      name: 'Order Status Update - Email',
      event: 'order.status_updated',
      channel: NotificationChannel.email,
      subject: 'Order {{orderReference}} - Status Update',
      template: `
        <h2>Order Status Update</h2>
        <p>Hi {{customerName}},</p>
        <p>Your order <strong>{{orderReference}}</strong> status has been updated to: <strong>{{newStatus}}</strong></p>
        <p>{{statusMessage}}</p>
        <p>Thank you for your patience!</p>
      `,
      isActive: true,
    },
    {
      name: 'Order Status Update - Realtime',
      event: 'order.status_updated',
      channel: NotificationChannel.realtime,
      subject: 'Order status updated',
      template: 'Order {{orderReference}} is now {{newStatus}}',
      isActive: true,
    },

    // Shipping Notification
    {
      name: 'Shipping Notification - Email',
      event: 'order.shipped',
      channel: NotificationChannel.email,
      subject: 'Your Order {{orderReference}} Has Shipped!',
      template: `
        <h2>Your order is on the way!</h2>
        <p>Hi {{customerName}},</p>
        <p>Great news! Your order <strong>{{orderReference}}</strong> has been shipped.</p>
        <p><strong>Tracking Details:</strong></p>
        <ul>
          <li>Carrier: {{carrier}}</li>
          <li>Tracking Number: {{trackingNumber}}</li>
          <li>Estimated Delivery: {{estimatedDelivery}}</li>
        </ul>
        <p>You can track your shipment using the tracking number above.</p>
      `,
      isActive: true,
    },
    {
      name: 'Shipping Notification - Realtime',
      event: 'order.shipped',
      channel: NotificationChannel.realtime,
      subject: 'Your order has shipped',
      template: 'Order {{orderReference}} shipped via {{carrier}}. Tracking: {{trackingNumber}}',
      isActive: true,
    },

    // Welcome Email
    {
      name: 'Welcome Email',
      event: 'user.registered',
      channel: NotificationChannel.email,
      subject: 'Welcome to Our Fashion Store!',
      template: `
        <h2>Welcome {{firstName}}!</h2>
        <p>Thank you for joining our fashion community.</p>
        <p>We're excited to have you with us. Browse our latest collections and enjoy exclusive member benefits.</p>
        <p>Happy Shopping!</p>
      `,
      isActive: true,
    },

    // OTP Verification
    {
      name: 'OTP Verification',
      event: 'user.otp_requested',
      channel: NotificationChannel.email,
      subject: 'Your Verification Code',
      template: `
        <h2>Email Verification</h2>
        <p>Hi {{firstName}},</p>
        <p>Your verification code is: <strong>{{otpCode}}</strong></p>
        <p>This code will expire in {{expiryMinutes}} minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      `,
      isActive: true,
    },

    // Password Reset
    {
      name: 'Password Reset',
      event: 'user.password_reset_requested',
      channel: NotificationChannel.email,
      subject: 'Reset Your Password',
      template: `
        <h2>Password Reset Request</h2>
        <p>Hi {{firstName}},</p>
        <p>We received a request to reset your password.</p>
        <p>Your reset token: <strong>{{resetToken}}</strong></p>
        <p>This token will expire in {{expiryMinutes}} minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
      isActive: true,
    },

    // Review Request
    {
      name: 'Review Request',
      event: 'order.delivered',
      channel: NotificationChannel.email,
      subject: 'How was your experience?',
      template: `
        <h2>We'd love your feedback!</h2>
        <p>Hi {{customerName}},</p>
        <p>Your order <strong>{{orderReference}}</strong> has been delivered.</p>
        <p>We hope you're enjoying your purchase! Would you like to share your experience with a review?</p>
        <p>Your feedback helps us serve you better.</p>
      `,
      isActive: true,
    },
  ];

  // Upsert all templates
  let count = 0;
  for (const template of templates) {
    await prisma.notificationTemplate.upsert({
      where: { name: template.name },
      update: {
        event: template.event,
        channel: template.channel,
        subject: template.subject,
        template: template.template,
        isActive: template.isActive,
      },
      create: template,
    });
    count++;
  }

  console.log(`✅ Created/updated ${count} notification templates`);
  console.log('✅ Notification templates seeding completed!');
}
