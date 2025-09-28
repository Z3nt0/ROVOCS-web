#!/usr/bin/env node

/**
 * Simple Authentication Flow Test Script
 * Tests the login process step by step
 */

const https = require('https');

const PRODUCTION_URL = 'https://rovocs-web.vercel.app';

// Test user credentials
const TEST_USER = {
  email: 'anthony@aotsoftware.com',
  password: '1masteredCSHARP'
};

/**
 * Test NextAuth endpoints
 */
async function testNextAuthEndpoints() {
  console.log('🔍 Testing NextAuth Endpoints...\n');
  
  const endpoints = [
    '/api/auth/providers',
    '/api/auth/session', 
    '/api/auth/csrf',
    '/api/auth/signin',
    '/api/auth/error'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${PRODUCTION_URL}${endpoint}`);
      console.log(`${endpoint}:`);
      console.log(`  Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log('  ✅ Working');
      } else if (response.status === 401 || response.status === 403) {
        console.log('  ✅ Working (auth required)');
      } else if (response.status === 500) {
        console.log('  ❌ Server Error');
        console.log(`  Error: ${response.body.substring(0, 100)}`);
      } else {
        console.log(`  ⚠️ Status: ${response.status}`);
      }
      
      if (response.body && response.body.length < 500) {
        console.log(`  Response: ${response.body}`);
      }
      console.log('');
      
    } catch (error) {
      console.log(`${endpoint}: ❌ Failed - ${error.message}\n`);
    }
  }
}

/**
 * Test login process
 */
async function testLoginProcess() {
  console.log('🔐 Testing Login Process...\n');
  
  try {
    // Step 1: Get CSRF token
    console.log('Step 1: Getting CSRF token...');
    const csrfResponse = await makeRequest(`${PRODUCTION_URL}/api/auth/csrf`);
    console.log(`CSRF Status: ${csrfResponse.status}`);
    
    if (csrfResponse.status === 200) {
      const csrfData = JSON.parse(csrfResponse.body);
      console.log(`CSRF Token: ${csrfData.csrfToken.substring(0, 20)}...`);
      
      // Step 2: Attempt login
      console.log('\nStep 2: Attempting login...');
      const loginResponse = await makeRequest(
        `${PRODUCTION_URL}/api/auth/signin/credentials`,
        'POST',
        JSON.stringify({
          email: TEST_USER.email,
          password: TEST_USER.password,
          csrfToken: csrfData.csrfToken,
          redirect: false
        })
      );
      
      console.log(`Login Status: ${loginResponse.status}`);
      console.log(`Login Response: ${loginResponse.body}`);
      
      if (loginResponse.status === 200) {
        const loginData = JSON.parse(loginResponse.body);
        if (loginData.error) {
          console.log(`❌ Login Error: ${loginData.error}`);
        } else {
          console.log('✅ Login successful');
        }
      } else if (loginResponse.status === 302) {
        console.log('✅ Login successful (redirect to dashboard)');
        console.log(`Redirect Location: ${loginResponse.headers.location}`);
      } else {
        console.log(`❌ Login failed with status: ${loginResponse.status}`);
      }
    } else {
      console.log('❌ Failed to get CSRF token');
    }
    
  } catch (error) {
    console.log(`❌ Login test failed: ${error.message}`);
  }
}

/**
 * Test database connection
 */
async function testDatabase() {
  console.log('🗄️ Testing Database Connection...\n');
  
  try {
    // Test a database-dependent endpoint
    const response = await makeRequest(`${PRODUCTION_URL}/api/dashboard/stats`);
    console.log(`Database Test Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('✅ Database connection working (401 = auth required)');
    } else if (response.status === 200) {
      console.log('✅ Database connection working');
    } else if (response.status === 400) {
      console.log('✅ Database connection working (400 = missing userId parameter)');
    } else if (response.status === 500) {
      console.log('❌ Database error');
      console.log(`Error: ${response.body.substring(0, 200)}`);
    } else {
      console.log(`⚠️ Unexpected status: ${response.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Database test failed: ${error.message}`);
  }
}

/**
 * Make HTTP request
 */
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Auth-Test/1.0'
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

/**
 * Main test function
 */
async function runAuthTest() {
  console.log('🚀 Authentication Flow Test');
  console.log('==========================');
  console.log(`Testing: ${PRODUCTION_URL}`);
  console.log(`Time: ${new Date().toISOString()}\n`);
  
  // Update test credentials
  console.log('📝 Test Configuration:');
  console.log(`Email: ${TEST_USER.email}`);
  console.log(`Password: ${TEST_USER.password}`);
  console.log('(Update these in the script if needed)\n');
  
  // Run tests
  await testNextAuthEndpoints();
  await testDatabase();
  await testLoginProcess();
  
  console.log('🏁 Test Complete');
  console.log('================');
  console.log('Check the results above for any issues.');
}

// Run the test
if (require.main === module) {
  runAuthTest().catch(console.error);
}

module.exports = { runAuthTest, testNextAuthEndpoints, testLoginProcess };
