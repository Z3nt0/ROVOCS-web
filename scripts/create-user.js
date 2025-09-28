#!/usr/bin/env node

/**
 * Create User Script
 * Creates the test user in the production database
 */

const https = require('https');

const PRODUCTION_URL = 'https://rovocs-web.vercel.app';

// User to create
const USER_TO_CREATE = {
  name: 'Anthony Test',
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
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Create-User/1.0'
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    console.log(`🔗 Making ${method} request to: ${url}`);
    if (data) {
      console.log(`📤 Request data: ${JSON.stringify(JSON.parse(data), null, 2)}`);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`📥 Response status: ${res.statusCode}`);
        console.log(`📥 Response body: ${body}`);
        
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
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
 * Create user
 */
async function createUser() {
  console.log('👤 Creating User...');
  console.log('==================');
  console.log(`Name: ${USER_TO_CREATE.name}`);
  console.log(`Email: ${USER_TO_CREATE.email}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  try {
    const response = await makeRequest(
      `${PRODUCTION_URL}/api/auth`,
      'POST',
      JSON.stringify({
        action: 'signup',
        name: USER_TO_CREATE.name,
        email: USER_TO_CREATE.email,
        password: USER_TO_CREATE.password
      })
    );

    console.log(`\n📊 Create User Result:`);
    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      const result = JSON.parse(response.body);
      console.log('✅ User created successfully!');
      console.log(`User ID: ${result.user.id}`);
      console.log(`Name: ${result.user.name}`);
      console.log(`Email: ${result.user.email}`);
    } else if (response.status === 400) {
      const result = JSON.parse(response.body);
      if (result.error === 'User with this email already exists') {
        console.log('⚠️ User already exists');
        console.log('This means the user is in the database but login is still failing');
        console.log('The issue might be with password verification or NextAuth configuration');
      } else {
        console.log(`❌ User creation failed: ${result.error}`);
      }
    } else {
      console.log(`❌ User creation failed with status: ${response.status}`);
      console.log(`Error: ${response.body}`);
    }

  } catch (error) {
    console.log(`❌ Create user failed: ${error.message}`);
  }
}

/**
 * Test login after user creation
 */
async function testLoginAfterCreation() {
  console.log('\n🔐 Testing Login After User Creation...');
  
  try {
    // Get CSRF token
    const csrfResponse = await makeRequest(`${PRODUCTION_URL}/api/auth/csrf`);
    if (csrfResponse.status !== 200) {
      console.log('❌ Failed to get CSRF token');
      return;
    }
    
    const csrfData = JSON.parse(csrfResponse.body);
    console.log(`✅ CSRF token: ${csrfData.csrfToken.substring(0, 20)}...`);

    // Attempt login
    const loginResponse = await makeRequest(
      `${PRODUCTION_URL}/api/auth/signin/credentials`,
      'POST',
      JSON.stringify({
        email: USER_TO_CREATE.email,
        password: USER_TO_CREATE.password,
        csrfToken: csrfData.csrfToken,
        redirect: false
      })
    );

    console.log(`\n📊 Login Test Result:`);
    console.log(`Status: ${loginResponse.status}`);
    
    if (loginResponse.status === 200) {
      const result = JSON.parse(loginResponse.body);
      if (result.error) {
        console.log(`❌ Login Error: ${result.error}`);
      } else if (result.ok) {
        console.log('✅ Login successful!');
      } else {
        console.log('⚠️ Login response unclear');
      }
    } else if (loginResponse.status === 302) {
      console.log('✅ Login successful (redirect)');
      console.log(`Redirect to: ${loginResponse.headers.location}`);
    } else {
      console.log(`❌ Login failed with status: ${loginResponse.status}`);
    }

  } catch (error) {
    console.log(`❌ Login test failed: ${error.message}`);
  }
}

// Run the script
if (require.main === module) {
  createUser()
    .then(() => testLoginAfterCreation())
    .then(() => {
      console.log('\n🏁 User Creation Complete');
      console.log('========================');
    })
    .catch(console.error);
}

module.exports = { createUser, testLoginAfterCreation };
