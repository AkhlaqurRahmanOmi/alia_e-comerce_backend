// Cleanup test payments for order 12
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  console.log('Cleaning up test payments for order 12...');

  // Get all test payments for order 12 (pending, failed, or voided)
  const testPayments = await prisma.payment.findMany({
    where: {
      orderId: 12,
      status: { in: ['pending', 'failed', 'voided'] }
    },
    select: { id: true, status: true }
  });

  if (testPayments.length === 0) {
    console.log('No test payments to delete');
  } else {
    // Delete related transaction logs first
    const logsDeleted = await prisma.transactionLog.deleteMany({
      where: {
        paymentId: { in: testPayments.map(p => p.id) }
      }
    });

    console.log(`✓ Deleted ${logsDeleted.count} transaction log(s)`);

    // Now delete the payments
    const deleted = await prisma.payment.deleteMany({
      where: {
        orderId: 12,
        status: { in: ['pending', 'failed', 'voided'] }
      }
    });

    console.log(`✓ Deleted ${deleted.count} test payment(s)`);
  }

  const remaining = await prisma.payment.findMany({
    where: { orderId: 12 },
    select: { id: true, transactionId: true, status: true, createdAt: true }
  });

  console.log(`\nRemaining payments for order 12:`);
  console.table(remaining);

  await prisma.$disconnect();
}

cleanup().catch(console.error);