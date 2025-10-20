require('dotenv').config();
const { Resend } = require('resend');

console.log('🔍 RESEND DIAGNOSTIC TOOL\n');
console.log('=' .repeat(50));

const apiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM;

console.log('\n1️⃣  ENVIRONMENT VARIABLES:');
console.log('   RESEND_API_KEY:', apiKey ? `${apiKey.substring(0, 8)}...` : '❌ NOT SET');
console.log('   EMAIL_FROM:', emailFrom || '❌ NOT SET');

if (!apiKey) {
  console.log('\n❌ FATAL: No API key found!');
  process.exit(1);
}

const resend = new Resend(apiKey);

async function diagnose() {
  console.log('\n2️⃣  TESTING API KEY AUTHENTICATION:');
  
  try {
    // Test 1: Send to Resend's test address
    console.log('   Test 1: Sending to delivered@resend.dev...');
    const test1 = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'delivered@resend.dev',
      subject: 'Test 1: Authentication Check',
      html: '<p>Testing API key</p>',
    });
    console.log('   ✅ Test 1 PASSED - API key is valid');
    console.log('   Email ID:', test1.data?.id);
  } catch (error) {
    console.log('   ❌ Test 1 FAILED');
    console.log('   Error:', error.message);
    console.log('   Status Code:', error.statusCode);
    
    if (error.statusCode === 401 || error.statusCode === 403) {
      console.log('\n🚨 CRITICAL: API KEY IS INVALID OR EXPIRED!');
      console.log('\nPossible causes:');
      console.log('   - API key was regenerated in Resend dashboard');
      console.log('   - API key was deleted');
      console.log('   - Resend account suspended');
      console.log('\nSolution:');
      console.log('   1. Go to https://resend.com/api-keys');
      console.log('   2. Check if this key exists and is active');
      console.log('   3. If not, create a NEW key');
      console.log('   4. Update your .env file and Railway variables');
      return;
    } else if (error.statusCode === 429) {
      console.log('\n🚨 RATE LIMIT HIT!');
      console.log('   You\'ve exceeded Resend\'s rate limits');
      console.log('   Wait a few minutes and try again');
      return;
    } else {
      console.log('\n🚨 UNEXPECTED ERROR:', error);
      return;
    }
  }

  // Test 2: Send with custom domain
  console.log('\n3️⃣  TESTING CUSTOM DOMAIN:');
  if (emailFrom && emailFrom !== 'onboarding@resend.dev') {
    try {
      console.log(`   Test 2: Sending from ${emailFrom}...`);
      const test2 = await resend.emails.send({
        from: emailFrom,
        to: 'delivered@resend.dev',
        subject: 'Test 2: Custom Domain Check',
        html: '<p>Testing custom domain</p>',
      });
      console.log('   ✅ Test 2 PASSED - Custom domain works');
      console.log('   Email ID:', test2.data?.id);
    } catch (error) {
      console.log('   ❌ Test 2 FAILED');
      console.log('   Error:', error.message);
      
      if (error.message.includes('domain') || error.message.includes('verified')) {
        console.log('\n🚨 DOMAIN NOT VERIFIED!');
        console.log(`   Domain: ${emailFrom.split('@')[1]}`);
        console.log('\nSolution:');
        console.log('   1. Go to https://resend.com/domains');
        console.log('   2. Verify your domain with DNS records');
        console.log('   OR use: EMAIL_FROM=onboarding@resend.dev');
      }
    }
  } else {
    console.log('   ℹ️  Using Resend\'s verified domain (onboarding@resend.dev)');
  }

  // Test 3: Send to real email
  console.log('\n4️⃣  TESTING REAL EMAIL DELIVERY:');
  try {
    console.log('   Test 3: Sending to harambiryani1@gmail.com...');
    const test3 = await resend.emails.send({
      from: emailFrom || 'onboarding@resend.dev',
      to: 'harambiryani1@gmail.com',
      subject: '🧪 Resend Diagnostic Test Email',
      html: `
        <h1>Diagnostic Test Email</h1>
        <p>If you receive this, your Resend integration is working!</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>From:</strong> ${emailFrom || 'onboarding@resend.dev'}</p>
      `,
    });
    console.log('   ✅ Test 3 PASSED - Email sent successfully!');
    console.log('   Full response:', JSON.stringify(test3, null, 2));
    console.log('   Email ID:', test3.data?.id || test3.id);
    console.log('\n📧 CHECK YOUR EMAIL: harambiryani1@gmail.com');
    console.log('   (Including spam folder)');
    const emailId = test3.data?.id || test3.id;
    if (emailId) {
      console.log(`\n🔗 View in Resend: https://resend.com/emails/${emailId}`);
    }
  } catch (error) {
    console.log('   ❌ Test 3 FAILED');
    console.log('   Error:', error.message);
    console.log('   Status Code:', error.statusCode);
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n✅ DIAGNOSTIC COMPLETE');
  console.log('\nIf all tests passed:');
  console.log('   - Your Resend setup is working');
  console.log('   - Check email and spam folder');
  console.log('   - Check Resend dashboard for email status');
  console.log('\nIf tests failed:');
  console.log('   - Follow the solutions printed above');
  console.log('   - Update .env and Railway variables');
  console.log('   - Run this script again to verify');
}

diagnose().catch(console.error);
