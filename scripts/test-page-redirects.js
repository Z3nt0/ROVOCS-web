#!/usr/bin/env node

/**
 * Test Page Redirects After Login
 * Tests if authentication redirects work properly to dashboard and other pages
 */

const https = require('https');

const PRODUCTION_URL = 'https://rovocs-web.vercel.app';

// Test user credentials
const TEST_USER = {
  email: 'anthony@aotsoftware.com',
  password: '1masteredCSHARP'
};

/**
 * Test pages that should redirect when not authenticated
 */
const PROTECTED_PAGES = [
  { name: 'Dashboard', url: '/dashboard' },
  { name: 'Device Page', url: '/device' },
  { name: 'Reports Page', url: '/reports' }
];

/**
 * Test pages that should be accessible without authentication
 */
const PUBLIC_PAGES = [
  { name: 'Home Page', url: '/' },
  { name: 'Login Page', url: '/auth/login' },
  { name: 'Signup Page', url: '/auth/signup' }
];

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
        'User-Agent': 'Page-Redirect-Test/1.0',
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
        console.log(`📥 Content-Type: ${res.headers['content-type'] || 'None'}`);
        
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
 * Test protected pages (should redirect to login when not authenticated)
 */
async function testProtectedPages() {
  console.log('🔒 Testing Protected Pages (Should Redirect to Login)...');
  console.log('=======================================================');
  
  for (const page of PROTECTED_PAGES) {
    console.log(`\n📄 Testing ${page.name}...`);
    
    try {
      const response = await makeRequest(`${PRODUCTION_URL}${page.url}`);
      
      console.log(`Status: ${response.status}`);
      console.log(`Location: ${response.headers.location || 'None'}`);
      
      if (response.status === 307 || response.status === 302) {
        const location = response.headers.location;
        if (location && location.includes('/auth/login')) {
          console.log('✅ Correctly redirects to login page');
        } else if (location && location.includes('/api/auth/signin')) {
          console.log('✅ Correctly redirects to NextAuth signin');
        } else {
          console.log(`⚠️ Redirects to: ${location}`);
        }
      } else if (response.status === 200) {
        console.log('⚠️ Page is accessible without authentication (might be an issue)');
      } else {
        console.log(`❌ Unexpected status: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Failed to test ${page.name}: ${error.message}`);
    }
  }
}

/**
 * Test public pages (should be accessible without authentication)
 */
async function testPublicPages() {
  console.log('\n🌐 Testing Public Pages (Should Be Accessible)...');
  console.log('================================================');
  
  for (const page of PUBLIC_PAGES) {
    console.log(`\n📄 Testing ${page.name}...`);
    
    try {
      const response = await makeRequest(`${PRODUCTION_URL}${page.url}`);
      
      console.log(`Status: ${response.status}`);
      console.log(`Content-Type: ${response.headers['content-type'] || 'None'}`);
      
      if (response.status === 200) {
        console.log('✅ Page is accessible');
      } else if (response.status === 307 || response.status === 302) {
        console.log(`⚠️ Page redirects: ${response.headers.location}`);
      } else {
        console.log(`❌ Unexpected status: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Failed to test ${page.name}: ${error.message}`);
    }
  }
}

/**
 * Test login process and session
 */
async function testLoginProcess() {
  console.log('\n🔐 Testing Login Process...');
  console.log('===========================');
  
  try {
    // Step 1: Get CSRF token
    console.log('\n1️⃣ Getting CSRF token...');
    const csrfResponse = await makeRequest(`${PRODUCTION_URL}/api/auth/csrf`);
    
    if (csrfResponse.status !== 200) {
      console.log(`❌ Failed to get CSRF token: ${csrfResponse.status}`);
      return false;
    }
    
    const csrfData = JSON.parse(csrfResponse.body);
    console.log(`✅ CSRF token: ${csrfData.csrfToken.substring(0, 20)}...`);

    // Step 2: Attempt login
    console.log('\n2️⃣ Attempting login...');
    const loginData = JSON.stringify({
      email: TEST_USER.email,
      password: TEST_USER.password,
      csrfToken: csrfData.csrfToken,
      redirect: false
    });

    const loginResponse = await makeRequest(
      `${PRODUCTION_URL}/api/auth/signin/credentials`,
      'POST',
      loginData
    );

    console.log(`Login Status: ${loginResponse.status}`);
    console.log(`Login Location: ${loginResponse.headers.location || 'None'}`);
    
    if (loginResponse.status === 302) {
      const location = loginResponse.headers.location;
      if (location && location.includes('csrf=true')) {
        console.log('❌ CSRF token mismatch - login failed');
        return false;
      } else {
        console.log('✅ Login successful (redirect)');
        return true;
      }
    } else if (loginResponse.status === 200) {
      const result = JSON.parse(loginResponse.body);
      if (result.error) {
        console.log(`❌ Login Error: ${result.error}`);
        return false;
      } else if (result.ok) {
        console.log('✅ Login successful');
        return true;
      }
    }
    
    console.log(`❌ Login failed with status: ${loginResponse.status}`);
    return false;

  } catch (error) {
    console.log(`❌ Login test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test session after login
 */
async function testSession() {
  console.log('\n🔍 Testing Session...');
  console.log('====================');
  
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
 * Test dashboard access after login
 */
async function testDashboardAccess() {
  console.log('\n📊 Testing Dashboard Access...');
  console.log('==============================');
  
  try {
    const response = await makeRequest(`${PRODUCTION_URL}/dashboard`);
    console.log(`Dashboard Status: ${response.status}`);
    console.log(`Dashboard Location: ${response.headers.location || 'None'}`);
    
    if (response.status === 200) {
      console.log('✅ Dashboard accessible - user is authenticated');
      return true;
    } else if (response.status === 307 || response.status === 302) {
      const location = response.headers.location;
      if (location && location.includes('/auth/login')) {
        console.log('❌ Dashboard redirects to login - user not authenticated');
      } else {
        console.log(`⚠️ Dashboard redirects to: ${location}`);
      }
      return false;
    } else {
      console.log(`❌ Dashboard access failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Dashboard test failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test function
 */
async function runRedirectTests() {
  console.log('🚀 Page Redirect Test Suite');
  console.log('==========================');
  console.log(`Testing: ${PRODUCTION_URL}`);
  console.log(`User: ${TEST_USER.email}`);
  console.log(`Time: ${new Date().toISOString()}\n`);
  
  // Test protected pages (should redirect to login)
  await testProtectedPages();
  
  // Test public pages (should be accessible)
  await testPublicPages();
  
  // Test login process
  const loginSuccess = await testLoginProcess();
  
  // Test session
  const sessionActive = await testSession();
  
  // Test dashboard access
  const dashboardAccess = await testDashboardAccess();
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Login Process: ${loginSuccess ? '✅' : '❌'}`);
  console.log(`Session Active: ${sessionActive ? '✅' : '❌'}`);
  console.log(`Dashboard Access: ${dashboardAccess ? '✅' : '❌'}`);
  
  if (loginSuccess && sessionActive && dashboardAccess) {
    console.log('\n✅ All authentication and redirects working correctly!');
  } else {
    console.log('\n❌ Some authentication or redirect issues found');
    console.log('Check the detailed results above for specific issues');
  }
  
  console.log('\n🏁 Redirect Tests Complete');
  console.log('==========================');
}

// Run the tests
if (require.main === module) {
  runRedirectTests().catch(console.error);
}

module.exports = { runRedirectTests, testProtectedPages, testPublicPages, testLoginProcess };
