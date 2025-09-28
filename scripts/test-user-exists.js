#!/usr/bin/env node

/**
 * Test if user exists in database
 * This will help us determine if the issue is with user data or authentication
 */

const https = require('https');

const PRODUCTION_URL = 'https://rovocs-web.vercel.app';

// Test user credentials
const TEST_USER = {
  email: 'anthony@aotsoftware.com',
  password: '1masteredCSHARP'
};

/**
 * Test user creation endpoint (if it exists)
 */
async function testUserCreation() {
  console.log('🔍 Testing User Creation...');
  
  try {
    const response = await makeRequest(
      `${PRODUCTION_URL}/api/auth/signup`,
      'POST',
      JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
        name: 'Anthony Test'
      })
    );
    
    console.log(`Signup status: ${response.status}`);
    console.log(`Response: ${response.body}`);
    
    if (response.status === 200) {
      console.log('✅ User creation successful');
    } else if (response.status === 400) {
      console.log('⚠️ User might already exist');
    } else {
      console.log(`❌ User creation failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ User creation test failed: ${error.message}`);
  }
}

/**
 * Test database connection with a simple endpoint
 */
async function testDatabaseConnection() {
  console.log('\n🗄️ Testing Database Connection...');
  
  try {
    // Try to access a database-dependent endpoint
    const response = await makeRequest(`${PRODUCTION_URL}/api/readings`);
    console.log(`Readings endpoint status: ${response.status}`);
    console.log(`Response: ${response.body.substring(0, 200)}...`);
    
    if (response.status === 400) {
      console.log('✅ Database connection working (400 = missing parameters)');
    } else if (response.status === 401) {
      console.log('✅ Database connection working (401 = auth required)');
    } else if (response.status === 500) {
      console.log('❌ Database error');
    } else {
      console.log(`⚠️ Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Database test failed: ${error.message}`);
  }
}

/**
 * Test NextAuth configuration
 */
async function testNextAuthConfig() {
  console.log('\n⚙️ Testing NextAuth Configuration...');
  
  try {
    // Test if NextAuth is properly configured
    const response = await makeRequest(`${PRODUCTION_URL}/api/auth/providers`);
    console.log(`Providers status: ${response.status}`);
    
    if (response.status === 200) {
      const data = JSON.parse(response.body);
      console.log(`Providers: ${JSON.stringify(data, null, 2)}`);
      
      if (data.credentials) {
        console.log('✅ Credentials provider configured');
      } else {
        console.log('❌ Credentials provider not found');
      }
    } else {
      console.log(`❌ Providers endpoint failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ NextAuth config test failed: ${error.message}`);
  }
}

/**
 * Test environment variables (indirectly)
 */
async function testEnvironmentVariables() {
  console.log('\n🔧 Testing Environment Variables...');
  
  try {
    // Test if NEXTAUTH_SECRET is set by checking if we get proper CSRF tokens
    const response = await makeRequest(`${PRODUCTION_URL}/api/auth/csrf`);
    console.log(`CSRF status: ${response.status}`);
    
    if (response.status === 200) {
      const data = JSON.parse(response.body);
      if (data.csrfToken && data.csrfToken.length > 20) {
        console.log('✅ NEXTAUTH_SECRET appears to be set (valid CSRF token)');
      } else {
        console.log('❌ NEXTAUTH_SECRET might not be set (invalid CSRF token)');
      }
    } else {
      console.log(`❌ CSRF endpoint failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Environment test failed: ${error.message}`);
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
        'User-Agent': 'User-Test/1.0'
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
async function runUserTests() {
  console.log('🔍 User Existence and Database Test');
  console.log('===================================');
  console.log(`Testing: ${PRODUCTION_URL}`);
  console.log(`User: ${TEST_USER.email}`);
  console.log(`Time: ${new Date().toISOString()}\n`);
  
  await testUserCreation();
  await testDatabaseConnection();
  await testNextAuthConfig();
  await testEnvironmentVariables();
  
  console.log('\n🏁 User Tests Complete');
  console.log('======================');
  console.log('Check the results above to identify the issue.');
}

// Run the tests
if (require.main === module) {
  runUserTests().catch(console.error);
}

module.exports = { runUserTests, testUserCreation, testDatabaseConnection };
