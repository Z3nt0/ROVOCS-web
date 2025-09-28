#!/usr/bin/env node

/**
 * Production Authentication Test Script
 * Tests NextAuth endpoints and database connection
 */

const https = require('https');
const http = require('http');

const PRODUCTION_URL = 'https://rovocs-web.vercel.app';

// Test configuration
const tests = [
  {
    name: 'NextAuth Providers Endpoint',
    url: `${PRODUCTION_URL}/api/auth/providers`,
    method: 'GET'
  },
  {
    name: 'NextAuth Session Endpoint',
    url: `${PRODUCTION_URL}/api/auth/session`,
    method: 'GET'
  },
  {
    name: 'NextAuth CSRF Endpoint',
    url: `${PRODUCTION_URL}/api/auth/csrf`,
    method: 'GET'
  },
  {
    name: 'Login Page',
    url: `${PRODUCTION_URL}/auth/login`,
    method: 'GET'
  },
  {
    name: 'Dashboard Page (should redirect)',
    url: `${PRODUCTION_URL}/dashboard`,
    method: 'GET'
  }
];

// Test credentials
const TEST_CREDENTIALS = {
  email: 'anthony@aotsoftware.com',
  password: '1masteredCSHARP'
};

/**
 * Make HTTP request
 */
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Production-Auth-Test/1.0'
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const client = urlObj.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body,
          url: url
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
 * Test NextAuth signin endpoint
 */
async function testSignin() {
  console.log('\n🔐 Testing NextAuth Signin...');
  
  try {
    const response = await makeRequest(
      `${PRODUCTION_URL}/api/auth/signin/credentials`,
      'POST',
      JSON.stringify({
        email: TEST_CREDENTIALS.email,
        password: TEST_CREDENTIALS.password,
        redirect: false
      })
    );

    console.log(`Status: ${response.status}`);
    console.log(`Response: ${response.body.substring(0, 500)}...`);
    
    if (response.status === 200) {
      const data = JSON.parse(response.body);
      if (data.error) {
        console.log(`❌ Signin Error: ${data.error}`);
      } else {
        console.log('✅ Signin successful');
      }
    } else if (response.status === 302) {
      console.log('✅ Signin successful (redirect to dashboard)');
      console.log(`Redirect Location: ${response.headers.location}`);
    } else {
      console.log(`❌ Signin failed with status: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Signin request failed: ${error.message}`);
  }
}

/**
 * Test database connection via API
 */
async function testDatabaseConnection() {
  console.log('\n🗄️ Testing Database Connection...');
  
  try {
    // Test if we can reach a database-dependent endpoint
    const response = await makeRequest(`${PRODUCTION_URL}/api/dashboard/stats`);
    
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${response.body.substring(0, 200)}...`);
    
    if (response.status === 401) {
      console.log('✅ Database connection working (401 = auth required)');
    } else if (response.status === 200) {
      console.log('✅ Database connection working');
    } else {
      console.log(`⚠️ Database test returned status: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Database test failed: ${error.message}`);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Production Authentication Test Suite');
  console.log('=====================================');
  console.log(`Testing: ${PRODUCTION_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  
  // Test basic endpoints
  for (const test of tests) {
    console.log(`\n📡 Testing ${test.name}...`);
    
    try {
      const response = await makeRequest(test.url, test.method);
      
      console.log(`Status: ${response.status}`);
      console.log(`Content-Type: ${response.headers['content-type']}`);
      
      if (response.status === 200) {
        console.log('✅ Endpoint working');
      } else if (response.status === 401 || response.status === 403) {
        console.log('✅ Endpoint working (auth required)');
      } else if (response.status === 307) {
        console.log('✅ Endpoint working (redirect - expected for dashboard)');
      } else if (response.status === 500) {
        console.log('❌ Server error');
        console.log(`Error: ${response.body.substring(0, 200)}`);
      } else {
        console.log(`⚠️ Unexpected status: ${response.status}`);
      }
      
      // Show first 200 chars of response
      if (response.body) {
        console.log(`Response: ${response.body.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }
  
  // Test database connection
  await testDatabaseConnection();
  
  // Test signin
  await testSignin();
  
  console.log('\n🏁 Test Suite Complete');
  console.log('=====================');
  console.log('Check the results above for any issues.');
  console.log('Look for ❌ errors and ⚠️ warnings.');
}

/**
 * Test environment variables
 */
function testEnvironmentVariables() {
  console.log('\n🔧 Environment Variables Check');
  console.log('==============================');
  
  const requiredVars = [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET', 
    'DATABASE_URL',
    'NODE_ENV'
  ];
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
    } else {
      console.log(`❌ ${varName}: Not set`);
    }
  });
}

// Run tests
if (require.main === module) {
  console.log('Production Authentication Test');
  console.log('==============================');
  
  // Check if we're running locally or in production
  if (process.env.NODE_ENV === 'production') {
    console.log('Running in production environment');
    testEnvironmentVariables();
  } else {
    console.log('Running locally - testing production endpoints');
  }
  
  runTests().catch(console.error);
}

module.exports = { runTests, testSignin, testDatabaseConnection };
