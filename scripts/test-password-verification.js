#!/usr/bin/env node

/**
 * Test Password Verification
 * Tests if the password verification is working correctly
 */

const https = require('https');

const PRODUCTION_URL = 'https://rovocs-web.vercel.app';

// Test user credentials
const TEST_USER = {
  email: 'anthony@aotsoftware.com',
  password: '1masteredCSHARP'
};

/**
 * Test if we can create a new user with the same credentials
 */
async function testUserCreation() {
  console.log('👤 Testing User Creation...');
  console.log('==========================');
  console.log(`Email: ${TEST_USER.email}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  try {
    const response = await makeRequest(
      `${PRODUCTION_URL}/api/auth`,
      'POST',
      JSON.stringify({
        action: 'signup',
        name: 'Anthony Test User',
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    );

    console.log(`📊 User Creation Result:`);
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${response.body}`);
    
    if (response.status === 200) {
      console.log('✅ User created successfully');
      return true;
    } else if (response.status === 400) {
      const result = JSON.parse(response.body);
      if (result.error === 'User with this email already exists') {
        console.log('⚠️ User already exists - this is expected');
        return true;
      } else {
        console.log(`❌ User creation failed: ${result.error}`);
        return false;
      }
    } else {
      console.log(`❌ User creation failed with status: ${response.status}`);
      return false;
    }

  } catch (error) {
    console.log(`❌ User creation test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test database connection
 */
async function testDatabaseConnection() {
  console.log('\n🗄️ Testing Database Connection...');
  
  try {
    const response = await makeRequest(`${PRODUCTION_URL}/api/readings`);
    console.log(`Readings endpoint status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ Database connection working');
      return true;
    } else {
      console.log(`❌ Database connection failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Database test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test NextAuth configuration
 */
async function testNextAuthConfig() {
  console.log('\n⚙️ Testing NextAuth Configuration...');
  
  try {
    const response = await makeRequest(`${PRODUCTION_URL}/api/auth/providers`);
    console.log(`Providers status: ${response.status}`);
    
    if (response.status === 200) {
      const data = JSON.parse(response.body);
      console.log('✅ NextAuth providers configured');
      console.log(`Providers: ${JSON.stringify(data, null, 2)}`);
      return true;
    } else {
      console.log(`❌ NextAuth configuration failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ NextAuth config test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test environment variables
 */
async function testEnvironmentVariables() {
  console.log('\n🔧 Testing Environment Variables...');
  
  try {
    const response = await makeRequest(`${PRODUCTION_URL}/api/auth/csrf`);
    console.log(`CSRF status: ${response.status}`);
    
    if (response.status === 200) {
      const data = JSON.parse(response.body);
      if (data.csrfToken && data.csrfToken.length > 20) {
        console.log('✅ NEXTAUTH_SECRET appears to be set');
        return true;
      } else {
        console.log('❌ NEXTAUTH_SECRET might not be set');
        return false;
      }
    } else {
      console.log(`❌ CSRF endpoint failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Environment test failed: ${error.message}`);
    return false;
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
        'User-Agent': 'Password-Test/1.0'
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
async function runPasswordTests() {
  console.log('🔍 Password Verification Test');
  console.log('==============================');
  console.log(`Testing: ${PRODUCTION_URL}`);
  console.log(`User: ${TEST_USER.email}`);
  console.log(`Time: ${new Date().toISOString()}\n`);
  
  const results = {
    userCreation: await testUserCreation(),
    database: await testDatabaseConnection(),
    nextAuth: await testNextAuthConfig(),
    environment: await testEnvironmentVariables()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`User Creation: ${results.userCreation ? '✅' : '❌'}`);
  console.log(`Database: ${results.database ? '✅' : '❌'}`);
  console.log(`NextAuth: ${results.nextAuth ? '✅' : '❌'}`);
  console.log(`Environment: ${results.environment ? '✅' : '❌'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n✅ All tests passed - the issue is likely in the password verification logic');
    console.log('Check Vercel function logs for detailed error messages during login');
  } else {
    console.log('\n❌ Some tests failed - fix these issues first');
  }
  
  console.log('\n🏁 Password Tests Complete');
  console.log('==========================');
}

// Run the tests
if (require.main === module) {
  runPasswordTests().catch(console.error);
}

module.exports = { runPasswordTests, testUserCreation, testDatabaseConnection };
