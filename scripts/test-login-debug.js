const https = require('https');
const { URL } = require('url');

const BASE_URL = 'https://rovocs-web.vercel.app';
const TEST_USER = {
  email: 'anthony@aotsoftware.com',
  password: '1masteredCSHARP'
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          location: res.headers.location
        });
      });
    });

    req.on('error', reject);

    if (options.data) {
      req.write(JSON.stringify(options.data));
    }

    req.end();
  });
}

async function testLoginDebug() {
  console.log('🔍 Login Debug Test');
  console.log('==================');
  console.log(`Testing: ${BASE_URL}`);
  console.log(`User: ${TEST_USER.email}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('');

  try {
    // Step 1: Get CSRF token
    console.log('1️⃣ Getting CSRF token...');
    const csrfResponse = await makeRequest(`${BASE_URL}/api/auth/csrf`);
    console.log(`CSRF Status: ${csrfResponse.status}`);
    
    if (csrfResponse.status !== 200) {
      console.log('❌ Failed to get CSRF token');
      return;
    }

    const csrfData = JSON.parse(csrfResponse.body);
    const csrfToken = csrfData.csrfToken;
    console.log(`CSRF Token: ${csrfToken.substring(0, 20)}...`);
    console.log('');

    // Step 2: Test login with detailed logging
    console.log('2️⃣ Testing login with detailed logging...');
    const loginData = {
      email: TEST_USER.email,
      password: TEST_USER.password,
      csrfToken: csrfToken,
      redirect: false
    };

    console.log('📤 Login data:', {
      email: loginData.email,
      password: '***',
      csrfToken: loginData.csrfToken.substring(0, 20) + '...',
      redirect: loginData.redirect
    });

    const loginResponse = await makeRequest(`${BASE_URL}/api/auth/signin/credentials`, {
      method: 'POST',
      data: loginData
    });

    console.log(`📥 Login Status: ${loginResponse.status}`);
    console.log(`📥 Location: ${loginResponse.location}`);
    console.log(`📥 Body: ${loginResponse.body.substring(0, 200)}...`);
    console.log('');

    // Step 3: Check session after login attempt
    console.log('3️⃣ Checking session after login...');
    const sessionResponse = await makeRequest(`${BASE_URL}/api/auth/session`);
    console.log(`Session Status: ${sessionResponse.status}`);
    console.log(`Session Body: ${sessionResponse.body}`);
    console.log('');

    // Step 4: Test dashboard access
    console.log('4️⃣ Testing dashboard access...');
    const dashboardResponse = await makeRequest(`${BASE_URL}/dashboard`);
    console.log(`Dashboard Status: ${dashboardResponse.status}`);
    console.log(`Dashboard Location: ${dashboardResponse.location}`);
    console.log('');

    // Analysis
    console.log('📊 Analysis:');
    console.log('============');
    
    if (loginResponse.status === 302 && loginResponse.location?.includes('csrf=true')) {
      console.log('❌ CSRF token mismatch - this indicates authentication failure');
      console.log('   The password verification is likely failing');
      console.log('   Check Vercel function logs for detailed error messages');
    } else if (loginResponse.status === 200) {
      console.log('✅ Login successful');
    } else {
      console.log(`⚠️ Unexpected response: ${loginResponse.status}`);
    }

    if (sessionResponse.body === '{}') {
      console.log('❌ Session is empty - user not authenticated');
    } else {
      console.log('✅ Session contains user data');
    }

    if (dashboardResponse.status === 307) {
      console.log('❌ Dashboard redirects to login - user not authenticated');
    } else if (dashboardResponse.status === 200) {
      console.log('✅ Dashboard accessible - user authenticated');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('');
  console.log('🏁 Debug Complete');
  console.log('=================');
}

testLoginDebug();

