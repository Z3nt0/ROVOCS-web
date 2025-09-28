#!/usr/bin/env node

/**
 * Final Authentication Test
 * Tests the complete authentication flow with all fixes applied
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
        'User-Agent': 'Final-Auth-Test/1.0',
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
 * Test complete authentication flow
 */
async function testCompleteAuthFlow() {
  console.log('🔐 Complete Authentication Flow Test');
  console.log('===================================');
  console.log(`Testing: ${PRODUCTION_URL}`);
  console.log(`User: ${TEST_USER.email}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  try {
    // Step 1: Check if user exists
    console.log('1️⃣ Checking if user exists...');
    const signupResponse = await makeRequest(
      `${PRODUCTION_URL}/api/auth`,
      'POST',
      JSON.stringify({
        action: 'signup',
        name: 'Anthony Test',
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    );

    if (signupResponse.status === 400) {
      const result = JSON.parse(signupResponse.body);
      if (result.error === 'User with this email already exists') {
        console.log('✅ User exists in database');
      } else {
        console.log(`❌ User creation failed: ${result.error}`);
        return false;
      }
    } else if (signupResponse.status === 200) {
      console.log('✅ User created successfully');
    } else {
      console.log(`❌ User check failed: ${signupResponse.status}`);
      return false;
    }

    // Step 2: Get CSRF token
    console.log('\n2️⃣ Getting CSRF token...');
    const csrfResponse = await makeRequest(`${PRODUCTION_URL}/api/auth/csrf`);
    
    if (csrfResponse.status !== 200) {
      console.log(`❌ Failed to get CSRF token: ${csrfResponse.status}`);
      return false;
    }
    
    const csrfData = JSON.parse(csrfResponse.body);
    console.log(`✅ CSRF token: ${csrfData.csrfToken.substring(0, 20)}...`);

    // Step 3: Test login with different approaches
    console.log('\n3️⃣ Testing login approaches...');
    
    // Approach 1: JSON login
    console.log('\n📤 Approach 1: JSON login...');
    const loginResponse1 = await makeRequest(
      `${PRODUCTION_URL}/api/auth/signin/credentials`,
      'POST',
      JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
        csrfToken: csrfData.csrfToken,
        redirect: false
      })
    );

    console.log(`Status: ${loginResponse1.status}`);
    console.log(`Location: ${loginResponse1.headers.location || 'None'}`);
    
    if (loginResponse1.status === 200) {
      const result = JSON.parse(loginResponse1.body);
      if (result.error) {
        console.log(`❌ Login Error: ${result.error}`);
      } else if (result.ok) {
        console.log('✅ Login successful with JSON');
        return true;
      }
    } else if (loginResponse1.status === 302) {
      const location = loginResponse1.headers.location;
      if (location && location.includes('csrf=true')) {
        console.log('❌ CSRF token mismatch with JSON');
      } else {
        console.log('✅ Login successful with JSON (redirect)');
        return true;
      }
    }

    // Approach 2: Form data login
    console.log('\n📤 Approach 2: Form data login...');
    const formData = new URLSearchParams({
      email: TEST_USER.email,
      password: TEST_USER.password,
      csrfToken: csrfData.csrfToken,
      redirect: 'false'
    });

    const loginResponse2 = await makeRequest(
      `${PRODUCTION_URL}/api/auth/signin/credentials`,
      'POST',
      formData.toString(),
      {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': `${PRODUCTION_URL}/auth/login`
      }
    );

    console.log(`Status: ${loginResponse2.status}`);
    console.log(`Location: ${loginResponse2.headers.location || 'None'}`);
    
    if (loginResponse2.status === 200) {
      console.log('✅ Login successful with form data');
      return true;
    } else if (loginResponse2.status === 302) {
      const location = loginResponse2.headers.location;
      if (location && location.includes('csrf=true')) {
        console.log('❌ CSRF token mismatch with form data');
      } else {
        console.log('✅ Login successful with form data (redirect)');
        return true;
      }
    }

    console.log('❌ All login approaches failed');
    return false;

  } catch (error) {
    console.log(`❌ Authentication test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test session after login
 */
async function testSessionAfterLogin() {
  console.log('\n🔍 Testing Session After Login...');
  
  try {
    const response = await makeRequest(`${PRODUCTION_URL}/api/auth/session`);
    console.log(`Session Status: ${response.status}`);
    
    if (response.status === 200) {
      const sessionData = JSON.parse(response.body);
      if (sessionData.user) {
        console.log('✅ Session active - user authenticated');
        console.log(`User: ${sessionData.user.email}`);
        return true;
      } else {
        console.log('❌ Session empty - user not authenticated');
        return false;
      }
    } else {
      console.log(`❌ Session check failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Session test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test protected pages access
 */
async function testProtectedPagesAccess() {
  console.log('\n🔒 Testing Protected Pages Access...');
  
  const protectedPages = ['/dashboard', '/device', '/reports'];
  let allProtected = true;
  
  for (const page of protectedPages) {
    console.log(`\n📄 Testing ${page}...`);
    
    try {
      const response = await makeRequest(`${PRODUCTION_URL}${page}`);
      console.log(`Status: ${response.status}`);
      console.log(`Location: ${response.headers.location || 'None'}`);
      
      if (response.status === 307 || response.status === 302) {
        const location = response.headers.location;
        if (location && (location.includes('/auth/login') || location.includes('/api/auth/signin'))) {
          console.log('✅ Page correctly protected (redirects to login)');
        } else {
          console.log(`⚠️ Page redirects to: ${location}`);
        }
      } else if (response.status === 200) {
        console.log('❌ Page accessible without authentication (security issue)');
        allProtected = false;
      } else {
        console.log(`⚠️ Unexpected status: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Failed to test ${page}: ${error.message}`);
      allProtected = false;
    }
  }
  
  return allProtected;
}

// Run the complete test
if (require.main === module) {
  testCompleteAuthFlow()
    .then((authSuccess) => {
      console.log(`\n📊 Authentication Result: ${authSuccess ? '✅' : '❌'}`);
      return testSessionAfterLogin();
    })
    .then((sessionActive) => {
      console.log(`📊 Session Result: ${sessionActive ? '✅' : '❌'}`);
      return testProtectedPagesAccess();
    })
    .then((pagesProtected) => {
      console.log(`📊 Pages Protected: ${pagesProtected ? '✅' : '❌'}`);
      
      console.log('\n🏁 Final Test Results:');
      console.log('======================');
      console.log('Check the detailed results above for specific issues.');
      console.log('If authentication is still failing, check Vercel function logs for detailed error messages.');
    })
    .catch(console.error);
}

module.exports = { testCompleteAuthFlow, testSessionAfterLogin, testProtectedPagesAccess };
