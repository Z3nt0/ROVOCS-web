# Mock ESP32 Simulator

This is a JavaScript-based simulator that mimics the behavior of the ESP32 device from `esp32.ino`. It simulates sensor readings and sends data to your ROVOCS web application, allowing you to test the system without physical hardware.

## Features

- **Realistic Sensor Simulation**: Mimics SGP30, BME280, and MQ135 sensors with realistic data patterns
- **Wi-Fi Connection Simulation**: Simulates network connectivity and reconnection
- **Baseline Capture**: Implements the same 60-second baseline capture as the real ESP32
- **Data Transmission**: Sends sensor data to your web application every 2 seconds
- **Debug Output**: Provides detailed logging of sensor readings and transmission status

## Prerequisites

- Node.js 14.0.0 or higher
- Your ROVOCS web application running on `localhost:3000`

## Quick Start

1. **Navigate to the docs directory:**
   ```bash
   cd docs
   ```

2. **Install dependencies (if needed):**
   ```bash
   npm install
   ```

3. **Configure the simulator:**
   Edit `mock-esp32.js` and update the configuration:
   ```javascript
   const CONFIG = {
     serverUrl: 'http://localhost:3000/api/device-data', // Your server URL
     deviceSerial: 'MOCK-ESP32-001', // Your device serial
     pairingCode: 'MOCK123', // Your pairing code
     // ... other settings
   };
   ```

4. **Start the simulator:**
   ```bash
   npm start
   # or
   node mock-esp32.js
   ```

## Configuration

### Server Settings
- **serverUrl**: The URL of your ROVOCS web application API endpoint
- **deviceSerial**: Unique identifier for your mock device
- **pairingCode**: Authentication code for device pairing

### Sensor Simulation
The simulator includes realistic sensor behavior:

- **SGP30 Air Quality**: TVOC (0-1000 ppb) and eCO₂ (400-2000 ppm) with natural variation
- **BME280 Environmental**: Temperature (18-30°C) and Humidity (30-80%) with trends
- **MQ135 Gas**: ADC values (0-4095) with realistic noise

### Timing
- **Send Interval**: 2000ms (2 seconds) - matches real ESP32
- **Baseline Capture**: 60 seconds of data collection before normal operation
- **Debug Output**: Every 1 second with detailed sensor readings

## Usage with ROVOCS Web App

1. **Start your ROVOCS web application:**
   ```bash
   npm run dev
   ```

2. **Register the mock device:**
   - Go to `http://localhost:3000/dashboard/connect`
   - Enter device details:
     - **Device Name**: "Mock ESP32"
     - **Device Serial**: "MOCK-ESP32-001" (or your chosen serial)
     - **Pairing Code**: Copy the generated code

3. **Update the mock ESP32 configuration:**
   - Copy the pairing code from the web app
   - Update `pairingCode` in `mock-esp32.js`
   - Update `deviceSerial` to match what you entered

4. **Start the mock ESP32:**
   ```bash
   node mock-esp32.js
   ```

5. **Monitor the data:**
   - Check the dashboard at `http://localhost:3000/dashboard`
   - View device status at `http://localhost:3000/dashboard/device`
   - Start a session to see real-time data

## Expected Output

```
🔧 Mock ESP32 Configuration:
   Server URL: http://localhost:3000/api/device-data
   Device Serial: MOCK-ESP32-001
   Pairing Code: MOCK123
   Send Interval: 2000ms

🚀 Mock ESP32 Device Starting...
📡 ROVOCS ESP32 Device Ready!
🔄 Starting sensor readings and data transmission
🔌 Connecting to Wi-Fi...
✅ Wi-Fi connected!
📡 IP address: 192.168.1.100 (simulated)
📊 Baseline captured: { baseline_TVOC: '52.34', baseline_eCO2: '612.45', baseline_MQ135: '1987.23' }
📊 Sensor Data: {
  "time_ms": 2000,
  "TVOC_ppb": "48.7",
  "eCO2_ppm": "598",
  "MQ135_ADC": "2012",
  "Temp_C": "22.3",
  "RH_pct": "51.2"
}
✅ Data sent successfully: {"message":"Reading recorded successfully","reading":{...}}
```

## Troubleshooting

### Common Issues

1. **"HTTP POST failed: 404"**
   - Ensure your ROVOCS web app is running on the correct port
   - Check that the `/api/device-data` endpoint exists

2. **"HTTP POST failed: 400"**
   - Verify the device is registered in the web app
   - Check that `deviceSerial` and `pairingCode` match the web app

3. **"Wi-Fi not connected"**
   - This is normal during startup - the simulator will connect automatically

4. **No data appearing in dashboard**
   - Check the device is registered and paired
   - Verify the server URL is correct
   - Check browser console for any errors

### Debug Mode

To see more detailed output, you can modify the logging in `mock-esp32.js`:

```javascript
// Add more detailed logging
console.log('🔍 Debug - Current readings:', state.currentReadings);
console.log('🔍 Debug - Baseline status:', state.baseline);
```

## Customization

### Sensor Behavior
Modify the sensor simulation parameters in the `CONFIG.sensors` object:

```javascript
sensors: {
  sgp30: {
    enabled: true,
    tvoc: { min: 0, max: 1000, base: 50, variation: 20 },
    eco2: { min: 400, max: 2000, base: 600, variation: 50 }
  },
  // ... other sensors
}
```

### Data Patterns
Adjust the variation and trends to simulate different environmental conditions:

```javascript
// Add more dramatic changes
const tvocTrend = Math.sin(elapsed / 5000) * 50; // Faster, larger changes
const tempTrend = Math.sin(elapsed / 10000) * 5; // Temperature swings
```

## Integration with Real ESP32

This mock simulator is designed to be a drop-in replacement for testing. When you're ready to use a real ESP32:

1. Upload the `esp32.ino` code to your ESP32
2. Update the Wi-Fi credentials in the Arduino code
3. Use the same `deviceSerial` and `pairingCode` from the web app
4. The real ESP32 will behave identically to this mock simulator

## License

MIT License - Feel free to modify and use for your ROVOCS project.


