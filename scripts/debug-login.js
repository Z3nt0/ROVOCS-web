#!/usr/bin/env node

/**
 * Debug Login Process
 * Detailed debugging of the login flow
 */

const https = require('https');

const PRODUCTION_URL = 'https://rovocs-web.vercel.app';

// Test user credentials
const TEST_USER = {
  email: 'anthony@aotsoftware.com',
  password: '1masteredCSHARP'
};

/**
 * Make HTTP request with detailed logging
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
        'User-Agent': 'Debug-Login/1.0',
        ...headers
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    console.log(`🔗 Making ${method} request to: ${url}`);
    if (data) {
      console.log(`📤 Request data: ${data.substring(0, 100)}...`);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`📥 Response status: ${res.statusCode}`);
        console.log(`📥 Response headers:`, res.headers);
        console.log(`📥 Response body: ${body.substring(0, 200)}...`);
        
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body,
          url: url
        });
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Request error: ${error.message}`);
      reject(error);
    });

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

/**
 * Test the complete login flow
 */
async function debugLoginFlow() {
  console.log('🔍 Debug Login Flow');
  console.log('==================');
  console.log(`Testing: ${PRODUCTION_URL}`);
  console.log(`User: ${TEST_USER.email}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  try {
    // Step 1: Get CSRF token
    console.log('\n1️⃣ Getting CSRF token...');
    const csrfResponse = await makeRequest(`${PRODUCTION_URL}/api/auth/csrf`);
    
    if (csrfResponse.status !== 200) {
      console.log(`❌ Failed to get CSRF token: ${csrfResponse.status}`);
      return;
    }
    
    const csrfData = JSON.parse(csrfResponse.body);
    console.log(`✅ CSRF token: ${csrfData.csrfToken.substring(0, 20)}...`);

    // Step 2: Test credentials endpoint
    console.log('\n2️⃣ Testing credentials endpoint...');
    const credentialsResponse = await makeRequest(`${PRODUCTION_URL}/api/auth/signin/credentials`);
    console.log(`Credentials endpoint status: ${credentialsResponse.status}`);

    // Step 3: Attempt login with proper headers
    console.log('\n3️⃣ Attempting login with proper headers...');
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
        'Content-Type': 'application/x-www-form-urlencoded',
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
          console.log('✅ Login successful');
        } else {
          console.log('⚠️ Login response unclear');
        }
      } catch (parseError) {
        console.log(`⚠️ Could not parse response: ${parseError.message}`);
        console.log(`Raw response: ${loginResponse.body}`);
      }
    } else if (loginResponse.status === 302) {
      console.log('✅ Login successful (redirect)');
      console.log(`Redirect to: ${loginResponse.headers.location}`);
    } else {
      console.log(`❌ Login failed with status: ${loginResponse.status}`);
    }

    // Step 4: Check session after login
    console.log('\n4️⃣ Checking session after login...');
    const sessionResponse = await makeRequest(`${PRODUCTION_URL}/api/auth/session`);
    console.log(`Session status: ${sessionResponse.status}`);
    console.log(`Session data: ${sessionResponse.body}`);

  } catch (error) {
    console.log(`❌ Debug failed: ${error.message}`);
  }
}

/**
 * Test database user lookup
 */
async function testDatabaseUser() {
  console.log('\n🗄️ Testing Database User Lookup...');
  
  try {
    // This would require a test endpoint that doesn't require auth
    // For now, we'll just check if the user exists by trying to access dashboard
    const dashboardResponse = await makeRequest(`${PRODUCTION_URL}/dashboard`);
    console.log(`Dashboard status: ${dashboardResponse.status}`);
    
    if (dashboardResponse.status === 307) {
      console.log('✅ Dashboard redirects (user not authenticated)');
    } else if (dashboardResponse.status === 200) {
      console.log('✅ Dashboard accessible (user authenticated)');
    } else {
      console.log(`⚠️ Dashboard status: ${dashboardResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Database test failed: ${error.message}`);
  }
}

// Run the debug
if (require.main === module) {
  debugLoginFlow()
    .then(() => testDatabaseUser())
    .then(() => {
      console.log('\n🏁 Debug Complete');
      console.log('================');
    })
    .catch(console.error);
}

module.exports = { debugLoginFlow, testDatabaseUser };
