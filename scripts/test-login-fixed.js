#!/usr/bin/env node

/**
 * Test Login with Fixed Configuration
 * Tests the login process after configuration fixes
 */

const https = require('https');

const PRODUCTION_URL = 'https://rovocs-web.vercel.app';

// Test user credentials
const TEST_USER = {
  email: 'anthony@aotsoftware.com',
  password: '1masteredCSHARP'
};

/**
 * Make HTTP request
 */
function makeRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Login-Fixed/1.0',
        ...headers
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    console.log(`🔗 ${method} ${url}`);
    if (data) {
      console.log(`📤 Data: ${JSON.stringify(JSON.parse(data), null, 2)}`);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`📥 Status: ${res.statusCode}`);
        console.log(`📥 Location: ${res.headers.location || 'None'}`);
        console.log(`📥 Body: ${body.substring(0, 200)}...`);
        
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Error: ${error.message}`);
      reject(error);
    });

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

/**
 * Test login with proper form data
 */
async function testLoginWithFormData() {
  console.log('🔐 Testing Login with Form Data...');
  console.log('==================================');
  console.log(`User: ${TEST_USER.email}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  try {
    // Step 1: Get CSRF token
    console.log('1️⃣ Getting CSRF token...');
    const csrfResponse = await makeRequest(`${PRODUCTION_URL}/api/auth/csrf`);
    
    if (csrfResponse.status !== 200) {
      console.log(`❌ Failed to get CSRF token: ${csrfResponse.status}`);
      return;
    }
    
    const csrfData = JSON.parse(csrfResponse.body);
    console.log(`✅ CSRF token: ${csrfData.csrfToken.substring(0, 20)}...`);

    // Step 2: Login with JSON data (NextAuth expects JSON)
    console.log('\n2️⃣ Attempting login with JSON data...');
    const loginData = JSON.stringify({
      email: TEST_USER.email,
      password: TEST_USER.password,
      csrfToken: csrfData.csrfToken,
      redirect: false
    });

    const loginResponse = await makeRequest(
      `${PRODUCTION_URL}/api/auth/signin/credentials`,
      'POST',
      loginData,
      {
        'Content-Type': 'application/json',
        'Referer': `${PRODUCTION_URL}/auth/login`
      }
    );

    console.log(`\n📊 Login Result:`);
    console.log(`Status: ${loginResponse.status}`);
    console.log(`Location: ${loginResponse.headers.location || 'None'}`);
    
    if (loginResponse.status === 200) {
      try {
        const result = JSON.parse(loginResponse.body);
        console.log(`Response: ${JSON.stringify(result, null, 2)}`);
        
        if (result.error) {
          console.log(`❌ Login Error: ${result.error}`);
        } else if (result.ok) {
          console.log('✅ Login successful!');
        } else {
          console.log('⚠️ Login response unclear');
        }
      } catch (parseError) {
        console.log(`⚠️ Could not parse response: ${parseError.message}`);
      }
    } else if (loginResponse.status === 302) {
      const location = loginResponse.headers.location;
      if (location && location.includes('csrf=true')) {
        console.log('❌ CSRF token mismatch - login failed');
      } else if (location && location.includes('/dashboard')) {
        console.log('✅ Login successful - redirecting to dashboard');
      } else {
        console.log(`✅ Login successful - redirecting to: ${location}`);
      }
    } else {
      console.log(`❌ Login failed with status: ${loginResponse.status}`);
    }

    // Step 3: Check session
    console.log('\n3️⃣ Checking session...');
    const sessionResponse = await makeRequest(`${PRODUCTION_URL}/api/auth/session`);
    console.log(`Session status: ${sessionResponse.status}`);
    
    if (sessionResponse.status === 200) {
      const sessionData = JSON.parse(sessionResponse.body);
      if (sessionData.user) {
        console.log('✅ Session active - user authenticated');
        console.log(`User: ${sessionData.user.email}`);
      } else {
        console.log('❌ Session empty - user not authenticated');
      }
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
}

// Run the test
if (require.main === module) {
  testLoginWithFormData()
    .then(() => {
      console.log('\n🏁 Login Test Complete');
      console.log('======================');
    })
    .catch(console.error);
}

module.exports = { testLoginWithFormData };
