/**
 * Manual Pesapal Payment Integration Test
 *
 * This script tests the actual Pesapal integration with your backend
 * Run with: node test-pesapal.js
 *
 * Prerequisites:
 * 1. Backend must be running (npm run start:dev)
 * 2. Database must have at least one order
 * 3. .env must have correct Pesapal credentials
 */

const BASE_URL = 'http://localhost:4000/api/v1';

// Test credentials
const TEST_CREDENTIALS = {
  email: 'james.towell@example.com',
  password: 'Password123!',
};

// Global auth token
let authToken = null;

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bright}[Step ${step}]${colors.reset} ${colors.cyan}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message) {
  log(`${colors.red}✗ ${message}${colors.reset}`);
}

function logWarning(message) {
  log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

async function makeRequest(method, endpoint, body = null, skipAuth = false) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add auth token if available and not skipped
  if (authToken && !skipAuth) {
    options.headers['Authorization'] = `Bearer ${authToken}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(data, null, 2));
    }

    return { success: true, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message, status: error.status };
  }
}

async function login() {
  logStep(0, 'Authenticating...');
  log(`   Email: ${TEST_CREDENTIALS.email}`);

  const loginResult = await makeRequest('POST', '/auth/sign-in', TEST_CREDENTIALS, true);

  if (loginResult.success) {
    if (loginResult.data.data && loginResult.data.data.accessToken) {
      authToken = loginResult.data.data.accessToken;
      logSuccess('Authentication successful');
      log(`   Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else if (loginResult.data.accessToken) {
      authToken = loginResult.data.accessToken;
      logSuccess('Authentication successful');
      log(`   Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      logError('Login succeeded but no token received');
      log(`   Response: ${JSON.stringify(loginResult.data, null, 2)}`);
      return false;
    }
  } else {
    logError(`Authentication failed: ${loginResult.error}`);
    log(`\n   ${colors.yellow}Please check:${colors.reset}`);
    log(`   - User exists in database`);
    log(`   - Email: ${TEST_CREDENTIALS.email}`);
    log(`   - Password is correct`);
    log(`   - Backend is running`);
    return false;
  }
}

async function testPesapalIntegration() {
  log('\n' + '='.repeat(60), colors.bright);
  log('       PESAPAL PAYMENT INTEGRATION TEST', colors.bright);
  log('='.repeat(60) + '\n', colors.bright);

  let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
  };

  // Test 0: Login first
  const loginSuccess = await login();
  if (!loginSuccess) {
    logError('\nCannot proceed without authentication. Exiting...');
    return;
  }

  // Test 1: Check available gateways
  logStep(1, 'Checking available payment gateways...');
  testResults.total++;

  const gatewaysResult = await makeRequest('GET', '/payments');

  if (gatewaysResult.success) {
    logSuccess('Available gateways retrieved successfully');
    const gateways = gatewaysResult.data.data?.gateways || gatewaysResult.data.gateways || [];
    log(`   Gateways: ${JSON.stringify(gateways)}`);

    if (Array.isArray(gateways) && gateways.includes('pesapal')) {
      logSuccess('Pesapal is configured and available');
      testResults.passed++;
    } else {
      logError('Pesapal is NOT available in the gateway list');
      log(`   Full response: ${JSON.stringify(gatewaysResult.data, null, 2)}`);
      testResults.failed++;
    }
  } else {
    logError(`Failed to get gateways: ${gatewaysResult.error}`);
    testResults.failed++;
  }

  // Test 2: Find an existing order
  logStep(2, 'Finding an existing order...');
  testResults.total++;

  const ordersResult = await makeRequest('GET', '/orders?page=1&limit=1');
  let orderId = null;

  if (ordersResult.success && ordersResult.data.data && ordersResult.data.data.length > 0) {
    orderId = ordersResult.data.data[0].id;
    logSuccess(`Found order ID: ${orderId}`);
    log(`   Order Number: ${ordersResult.data.data[0].orderNumber}`);
    log(`   Total Amount: KES ${ordersResult.data.data[0].totalAmount}`);
    testResults.passed++;
  } else {
    logWarning('No orders found in database');
    log(`   Create an order first or the test will fail`);
    orderId = 5; // Default fallback
    testResults.failed++;
  }

  // Test 3: Initiate payment
  logStep(3, 'Initiating test payment...');
  testResults.total++;

  const paymentData = {
    orderId: orderId, // Use the found order ID
    amount: 5000,
    currency: 'KES',
    gateway: 'pesapal',
    metadata: {
      email: 'test@example.com',
      phoneNumber: '+254712345678',
      firstName: 'John',
      lastName: 'Doe',
      countryCode: 'KE',
      address: '123 Test Street',
      address2: 'Apartment 4B',
      city: 'Nairobi',
      state: 'Nairobi County',
      postalCode: '00100',
      description: 'Payment for Wine Order #1 - Test',
    },
  };

  log(`   Request: ${JSON.stringify(paymentData, null, 2)}`);

  const paymentResult = await makeRequest('POST', '/payments/initiate', paymentData);

  if (paymentResult.success) {
    logSuccess('Payment initiated successfully');

    // Handle nested response structure
    const responseData = paymentResult.data.data || paymentResult.data;
    const payment = responseData.payment || responseData;
    const redirectUrl = responseData.redirectUrl || payment.redirectUrl;

    log(`   Transaction ID: ${payment.transactionId}`);
    log(`   Status: ${payment.status}`);
    log(`   Amount: KES ${payment.amount}`);

    if (redirectUrl) {
      logSuccess('Pesapal redirect URL generated');
      log(`   Redirect URL: ${redirectUrl}`);
      log(`\n   ${colors.yellow}Next step: Open this URL in browser to complete payment${colors.reset}`);
      testResults.passed++;

      // Save transaction ID for next test
      global.testTransactionId = payment.transactionId;

    } else {
      logWarning('No redirect URL provided');
      testResults.failed++;
    }
  } else {
    logError(`Failed to initiate payment: ${paymentResult.error}`);
    log(`\n   ${colors.yellow}Common issues:${colors.reset}`);
    log(`   - Order ID ${paymentData.orderId} doesn't exist (create an order first)`);
    log(`   - Order already has a successful payment`);
    log(`   - Pesapal credentials invalid in .env`);
    testResults.failed++;
  }


  async function wait(minutes) {
    const seconds = minutes * 60;
    log(
      `   ${colors.yellow}Waiting ${minutes} minutes (${seconds} seconds) before continuing...${colors.reset}`,
    );

    for (let i = seconds; i > 0; i--) {
      process.stdout.write(
        `\r   ${colors.cyan}Time remaining: ${Math.floor(i / 60)}:${(i % 60).toString().padStart(2, '0')}${colors.reset}`,
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    process.stdout.write('\r   ' + ' '.repeat(30) + '\r');
    logSuccess('Wait completed, continuing with tests...');
  }

  // Test 4: Verify payment (if we have transaction ID)
  if (global.testTransactionId) {
    logStep(4, 'Verifying payment status...');
    testResults.total++;

    log(`   Transaction ID: ${global.testTransactionId}`);

    const verifyResult = await makeRequest('POST', '/payments/verify', {
      transactionId: global.testTransactionId,
    });

    if (verifyResult.success) {
      logSuccess('Payment status retrieved successfully');
      const verifyData = verifyResult.data.data || verifyResult.data;
      const paymentStatus = verifyData.payment || verifyData;

      log(`   Status: ${paymentStatus.status}`);
      log(`   Transaction ID: ${paymentStatus.transactionId}`);
      log(`   Amount: ${paymentStatus.amount}`);

      if (paymentStatus.status === 'pending') {
        logWarning('Payment is still pending (not completed yet)');
        log(`   This is normal if you haven't completed payment on Pesapal`);
      } else if (paymentStatus.status === 'captured') {
        logSuccess('Payment captured successfully!');
      } else if (paymentStatus.status === 'failed') {
        logWarning('Payment failed');
      }

      testResults.passed++;
    } else {
      logError(`Failed to verify payment: ${verifyResult.error}`);
      testResults.failed++;
    }

    // Test 5: Get payment details
    logStep(5, 'Getting payment details...');
    testResults.total++;

    const detailsResult = await makeRequest('GET', `/payments/${global.testTransactionId}`);

    if (detailsResult.success) {
      logSuccess('Payment details retrieved successfully');
      const details = detailsResult.data.data || detailsResult.data;
      log(`   Payment ID: ${details.id}`);
      log(`   Order ID: ${details.orderId}`);
      log(`   Gateway: ${details.gateway}`);
      log(`   Provider: ${details.provider}`);
      log(`   Created: ${new Date(details.createdAt).toLocaleString()}`);

      if (details.transactionLogs && details.transactionLogs.length > 0) {
        log(`   Transaction logs: ${details.transactionLogs.length} entries`);
      }

      testResults.passed++;
    } else {
      logError(`Failed to get payment details: ${detailsResult.error}`);
      testResults.failed++;
    }

    // Test 6: Get order payments
    logStep(6, 'Getting all payments for the order...');
    testResults.total++;

    const orderPaymentsResult = await makeRequest('GET', `/payments/order/${paymentData.orderId}`);

    if (orderPaymentsResult.success) {
      logSuccess('Order payments retrieved successfully');
      log(`   Total payments: ${orderPaymentsResult.data.payments.length}`);
      log(`   Total attempts: ${orderPaymentsResult.data.stats.totalAttempts}`);
      log(`   Successful payments: ${orderPaymentsResult.data.stats.successfulPayments}`);
      log(`   Total paid: KES ${orderPaymentsResult.data.stats.totalPaid}`);
      testResults.passed++;
    } else {
      logError(`Failed to get order payments: ${orderPaymentsResult.error}`);
      testResults.failed++;
    }
  } else {
    logWarning('Skipping verification tests (no transaction ID available)');
  }

  // Print summary
  log('\n' + '='.repeat(60), colors.bright);
  log('                  TEST SUMMARY', colors.bright);
  log('='.repeat(60), colors.bright);
  log(`Total tests: ${testResults.total}`);
  log(`Passed: ${testResults.passed}`, colors.green);
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? colors.red : colors.reset);
  log(`Success rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  log('='.repeat(60) + '\n', colors.bright);

  if (testResults.failed === 0) {
    logSuccess('All tests passed! Pesapal integration is working correctly.');
  } else {
    logError('Some tests failed. Please check the errors above.');
  }

  // Instructions
  log('\n' + colors.yellow + 'NEXT STEPS:' + colors.reset);
  log('1. If payment initiation succeeded, open the redirect URL in your browser');
  log('2. Complete the payment using Pesapal test card:');
  log('   Card: 4111 1111 1111 1111, Expiry: 12/25, CVV: 123');
  log('3. After payment, you\'ll be redirected to your callback URL');
  log('4. Run verification again to see "captured" status\n');
}

// Run the test
log(`\n${colors.cyan}Starting Pesapal integration test...${colors.reset}`);
log(`${colors.cyan}Backend URL: ${BASE_URL}${colors.reset}\n`);

testPesapalIntegration()
  .then(() => {
    log(`\n${colors.green}Test completed!${colors.reset}\n`);
    process.exit(0);
  })
  .catch((error) => {
    logError(`\nUnexpected error: ${error.message}`);
    console.error(error);
    process.exit(1);
  });
