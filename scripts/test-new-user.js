const https = require('https');
const { URL } = require('url');

const BASE_URL = 'https://rovocs-web.vercel.app';
const NEW_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User'
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'POST',
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

async function testNewUser() {
  console.log('🧪 Test New User Authentication');
  console.log('===============================');
  console.log(`Testing: ${BASE_URL}`);
  console.log(`New User: ${NEW_USER.email}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('');

  try {
    // Step 1: Create new user
    console.log('1️⃣ Creating new user...');
    const createResponse = await makeRequest(`${BASE_URL}/api/auth`, {
      method: 'POST',
      data: {
        action: 'signup',
        name: NEW_USER.name,
        email: NEW_USER.email,
        password: NEW_USER.password
      }
    });

    console.log(`Create Status: ${createResponse.status}`);
    console.log(`Create Response: ${createResponse.body}`);
    console.log('');

    if (createResponse.status !== 200) {
      console.log('❌ Failed to create user');
      return;
    }

    console.log('✅ User created successfully');
    console.log('');

    // Step 2: Get CSRF token
    console.log('2️⃣ Getting CSRF token...');
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

    // Step 3: Test login with new user
    console.log('3️⃣ Testing login with new user...');
    const loginData = {
      email: NEW_USER.email,
      password: NEW_USER.password,
      csrfToken: csrfToken,
      redirect: false
    };

    const loginResponse = await makeRequest(`${BASE_URL}/api/auth/signin/credentials`, {
      method: 'POST',
      data: loginData
    });

    console.log(`Login Status: ${loginResponse.status}`);
    console.log(`Login Location: ${loginResponse.location}`);
    console.log(`Login Body: ${loginResponse.body.substring(0, 200)}...`);
    console.log('');

    // Step 4: Check session
    console.log('4️⃣ Checking session...');
    const sessionResponse = await makeRequest(`${BASE_URL}/api/auth/session`);
    console.log(`Session Status: ${sessionResponse.status}`);
    console.log(`Session Body: ${sessionResponse.body}`);
    console.log('');

    // Step 5: Test dashboard access
    console.log('5️⃣ Testing dashboard access...');
    const dashboardResponse = await makeRequest(`${BASE_URL}/dashboard`);
    console.log(`Dashboard Status: ${dashboardResponse.status}`);
    console.log(`Dashboard Location: ${dashboardResponse.location}`);
    console.log('');

    // Analysis
    console.log('📊 Analysis:');
    console.log('============');
    
    if (loginResponse.status === 302 && loginResponse.location?.includes('csrf=true')) {
      console.log('❌ CSRF token mismatch - authentication still failing');
      console.log('   This suggests a deeper issue with the authentication system');
    } else if (loginResponse.status === 200) {
      console.log('✅ Login successful with new user');
    } else if (loginResponse.status === 302 && !loginResponse.location?.includes('csrf=true')) {
      console.log('✅ Login successful (redirect to dashboard)');
    } else {
      console.log(`⚠️ Unexpected login response: ${loginResponse.status}`);
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
  console.log('🏁 New User Test Complete');
  console.log('=========================');
}

<<<<<<< HEAD
testNewUser();
=======
testNewUser();




>>>>>>> ecbaa8e3424b08b892e98ebf67a071ee3836b289
