/**
 * Mock ESP32 Simulator
 * Based on esp32.ino - Simulates ESP32 device behavior in JavaScript
 * 
 * This script simulates the ESP32 device sending sensor data to the ROVOCS web application.
 * It mimics the behavior of the Arduino code but runs in Node.js environment.
 */

import https from 'https';
import http from 'http';

// Configuration (matching esp32.ino)
const CONFIG = {
  // Server Configuration
  serverUrl: 'http://localhost:3000/api/device-data', // Change to your server URL
  deviceSerial: 'ESP32-123', // Mock device serial
  pairingCode: '1TXUDF', // Mock pairing code
  
  // Data sending configuration
  sendInterval: 2000, // Send data every 2 seconds (matching SEND_INTERVAL)
  
  // Sensor simulation parameters
  sensors: {
    // SGP30 Air Quality Sensor simulation
    sgp30: {
      enabled: true,
      tvoc: { min: 0, max: 1000, base: 50, variation: 20 },
      eco2: { min: 400, max: 2000, base: 600, variation: 50 }
    },
    
    // BME280 Environmental Sensor simulation
    bme280: {
      enabled: true,
      temperature: { min: 18, max: 30, base: 22, variation: 2 },
      humidity: { min: 30, max: 80, base: 50, variation: 10 }
    },
    
    // MQ135 Gas Sensor simulation
    mq135: {
      enabled: true,
      adc: { min: 0, max: 4095, base: 2000, variation: 200 }
    },
    
  }
};

// Global state (matching Arduino variables)
let state = {
  wifiConnected: false,
  lastSendTime: 0,
  startTime: Date.now(),
  
  // Baseline storage (matching Arduino)
  baseline: {
    tvoc: 0,
    eco2: 0,
    mq135: 0,
    samples: 0,
    captured: false
  },
  
  // Current sensor readings
  currentReadings: {
    tvoc: 0,
    eco2: 0,
    temperature: 25.0,
    humidity: 50.0,
    mq135_adc: 2000
  }
};

/**
 * Simulate WiFi connection (matching connectToWiFi function)
 */
function connectToWiFi() {
  console.log('🔌 Connecting to Wi-Fi...');
  
  // Simulate connection delay
  setTimeout(() => {
    state.wifiConnected = true;
    console.log('✅ Wi-Fi connected!');
    console.log('📡 IP address: 192.168.1.100 (simulated)');
  }, 2000);
}

/**
 * Generate realistic sensor readings with noise and variation
 */
function generateSensorReadings() {
  const now = Date.now();
  const elapsed = now - state.startTime;
  
  // SGP30 Air Quality Sensor simulation
  if (CONFIG.sensors.sgp30.enabled) {
    const tvocBase = CONFIG.sensors.sgp30.tvoc.base;
    const tvocVariation = CONFIG.sensors.sgp30.tvoc.variation;
    const tvocNoise = (Math.random() - 0.5) * tvocVariation;
    const tvocTrend = Math.sin(elapsed / 10000) * 10; // Slow trend
    state.currentReadings.tvoc = Math.max(0, tvocBase + tvocNoise + tvocTrend);
    
    const eco2Base = CONFIG.sensors.sgp30.eco2.base;
    const eco2Variation = CONFIG.sensors.sgp30.eco2.variation;
    const eco2Noise = (Math.random() - 0.5) * eco2Variation;
    const eco2Trend = Math.sin(elapsed / 15000) * 20; // Different trend
    state.currentReadings.eco2 = Math.max(400, eco2Base + eco2Noise + eco2Trend);
  }
  
  // BME280 Environmental Sensor simulation
  if (CONFIG.sensors.bme280.enabled) {
    const tempBase = CONFIG.sensors.bme280.temperature.base;
    const tempVariation = CONFIG.sensors.bme280.temperature.variation;
    const tempNoise = (Math.random() - 0.5) * tempVariation;
    const tempTrend = Math.sin(elapsed / 20000) * 1; // Very slow temperature trend
    state.currentReadings.temperature = tempBase + tempNoise + tempTrend;
    
    const humBase = CONFIG.sensors.bme280.humidity.base;
    const humVariation = CONFIG.sensors.bme280.humidity.variation;
    const humNoise = (Math.random() - 0.5) * humVariation;
    const humTrend = Math.sin(elapsed / 25000) * 5; // Humidity trend
    state.currentReadings.humidity = Math.max(0, Math.min(100, humBase + humNoise + humTrend));
  }
  
  // MQ135 Gas Sensor simulation
  if (CONFIG.sensors.mq135.enabled) {
    const mq135Base = CONFIG.sensors.mq135.adc.base;
    const mq135Variation = CONFIG.sensors.mq135.adc.variation;
    const mq135Noise = (Math.random() - 0.5) * mq135Variation;
    state.currentReadings.mq135_adc = Math.max(0, Math.min(4095, mq135Base + mq135Noise));
  }
  
}

/**
 * Capture baseline readings (matching Arduino baseline logic)
 */
function captureBaseline() {
  if (!state.baseline.captured && (Date.now() - state.startTime) <= 60000) {
    // Accumulate baseline readings for 60 seconds
    if (state.currentReadings.tvoc >= 0) {
      state.baseline.tvoc += state.currentReadings.tvoc;
    }
    if (state.currentReadings.eco2 >= 0) {
      state.baseline.eco2 += state.currentReadings.eco2;
    }
    state.baseline.mq135 += state.currentReadings.mq135_adc;
    state.baseline.samples++;
  } else if (state.baseline.samples > 0 && !state.baseline.captured) {
    // Calculate baseline averages
    state.baseline.tvoc /= state.baseline.samples;
    state.baseline.eco2 /= state.baseline.samples;
    state.baseline.mq135 /= state.baseline.samples;
    state.baseline.captured = true;
    
    console.log('📊 Baseline captured:', {
      baseline_TVOC: state.baseline.tvoc.toFixed(2),
      baseline_eCO2: state.baseline.eco2.toFixed(2),
      baseline_MQ135: state.baseline.mq135.toFixed(2)
    });
  }
}

/**
 * Send sensor data to web application (matching sendSensorData function)
 */
function sendSensorData() {
  if (!state.wifiConnected) {
    console.log('❌ Wi-Fi not connected, skipping data send');
    return;
  }
  
  const payload = {
    deviceSerial: CONFIG.deviceSerial,
    pairingCode: CONFIG.pairingCode,
    tvoc: state.currentReadings.tvoc,
    eco2: state.currentReadings.eco2,
    temperature: state.currentReadings.temperature,
    humidity: state.currentReadings.humidity,
    statusMsg: 'Data from Mock ESP32'
  };
  
  const postData = JSON.stringify(payload);
  
  const url = new URL(CONFIG.serverUrl);
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const client = url.protocol === 'https:' ? https : http;
  
  const req = client.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Data sent successfully:', data);
      } else {
        console.log('❌ HTTP POST failed:', res.statusCode, data);
      }
    });
  });
  
  req.on('error', (err) => {
    console.log('❌ Request error:', err.message);
  });
  
  req.write(postData);
  req.end();
}

/**
 * Main loop (matching Arduino loop function)
 */
function mainLoop() {
  const currentTime = Date.now();
  
  // Check Wi-Fi connection
  if (!state.wifiConnected) {
    console.log('🔄 Wi-Fi disconnected. Reconnecting...');
    connectToWiFi();
    return;
  }
  
  // Generate new sensor readings
  generateSensorReadings();
  
  // Capture baseline if needed
  captureBaseline();
  
  // Send data at regular intervals
  if (currentTime - state.lastSendTime >= CONFIG.sendInterval) {
    sendSensorData();
    state.lastSendTime = currentTime;
  }
  
  // Output sensor readings as JSON (matching Arduino debug output)
  const debugOutput = {
    time_ms: currentTime - state.startTime,
    TVOC_ppb: state.currentReadings.tvoc.toFixed(1),
    eCO2_ppm: state.currentReadings.eco2.toFixed(0),
    MQ135_ADC: state.currentReadings.mq135_adc,
    Temp_C: state.currentReadings.temperature.toFixed(1),
    RH_pct: state.currentReadings.humidity.toFixed(1)
  };
  
  console.log('📊 Sensor Data:', JSON.stringify(debugOutput, null, 2));
}

/**
 * Setup function (matching Arduino setup)
 */
function setup() {
  console.log('🚀 Mock ESP32 Device Starting...');
  console.log('📡 ROVOCS ESP32 Device Ready!');
  console.log('🔄 Starting sensor readings and data transmission');
  
  // Connect to Wi-Fi
  connectToWiFi();
  
  // Start the main loop
  setInterval(mainLoop, 1000); // Run every second (matching Arduino delay(1000))
}

/**
 * Error handling
 */
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the mock ESP32
console.log('🔧 Mock ESP32 Configuration:');
console.log('   Server URL:', CONFIG.serverUrl);
console.log('   Device Serial:', CONFIG.deviceSerial);
console.log('   Pairing Code:', CONFIG.pairingCode);
console.log('   Send Interval:', CONFIG.sendInterval + 'ms');
console.log('');

setup();
