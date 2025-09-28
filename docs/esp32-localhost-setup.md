# ESP32 Localhost Setup Guide

## Quick Setup Steps

### 1. **Find Your Computer's IP Address**

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your Wi-Fi adapter (usually starts with 192.168.x.x)

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" address under your Wi-Fi interface

### 2. **Update ESP32 Code**

In `docs/esp32.ino`, update these lines:

```cpp
// Wi-Fi Configuration
const char* ssid = "YOUR_WIFI_NAME";           // Your Wi-Fi network name
const char* password = "YOUR_WIFI_PASSWORD";  // Your Wi-Fi password

// ROVOCS Server Configuration (localhost)
const char* serverUrl = "http://192.168.1.100:3000/api/device-data"; // Replace with YOUR computer's IP
const char* deviceSerial = "ESP32-001";  // Change this to your device serial
const char* pairingCode = "ABC123";      // Get this from the web app
```

### 3. **Get Pairing Code from Web App**

1. Open your ROVOCS web app: `http://localhost:3000`
2. Go to **Dashboard** → **Connect Device**
3. Copy the pairing code (e.g., "ABC123")
4. Update the `pairingCode` variable in your ESP32 code

### 4. **Upload Code to ESP32**

1. Open Arduino IDE
2. Select your ESP32 board
3. Upload the updated code
4. Open Serial Monitor (115200 baud)

### 5. **Test Connection**

**Expected Serial Output:**
```
Connecting to Wi-Fi........
Wi-Fi connected!
IP address: 192.168.1.150
I2C Scanner (one-shot):
  - Found device at 0x58
  - Found device at 0x76
{"message":"SGP30 sensor initialized."}
{"message":"BME280 sensor initialized."}
{"message":"ROVOCS ESP32 Device Ready!"}
{"message":"Starting sensor readings and data transmission"}
Data sent successfully: {"success":true,"message":"Data received successfully"}
```

### 6. **Register Device in Web App**

1. Go to **Dashboard** → **Connect Device**
2. Enter:
   - **Device Name**: "My ESP32 Sensor"
   - **Device Serial**: "ESP32-001" (must match your code)
3. Copy the pairing code and update your ESP32 code
4. Click **"Connect Device"**

### 7. **Verify Data Flow**

1. Go to **Dashboard** → **Devices**
2. Your device should show as "Online"
3. Go to **Dashboard** → **Start Session**
4. Select your device and start a session
5. You should see real-time data!

## Troubleshooting

### **ESP32 won't connect to Wi-Fi:**
- Check SSID and password are correct
- Ensure Wi-Fi is 2.4GHz (ESP32 doesn't support 5GHz)
- Check signal strength

### **"HTTP POST failed" errors:**
- Verify your computer's IP address is correct
- Make sure your web app is running on port 3000
- Check that your computer and ESP32 are on the same network

### **"Device not found" in web app:**
- Ensure device is registered first in "Connect Device" page
- Check device serial number matches exactly
- Verify pairing code is correct

### **No sensor data:**
- Check sensor wiring (SDA/SCL connections)
- Verify pull-up resistors are connected
- Check sensor power supply

## Network Configuration

### **Common IP Address Ranges:**
- **192.168.1.x** - Most home routers
- **192.168.0.x** - Some routers
- **10.0.0.x** - Some corporate networks

### **Port Configuration:**
- **Web App**: `http://YOUR_IP:3000`
- **API Endpoint**: `http://YOUR_IP:3000/api/device-data`

## Example Configuration

```cpp
// Example for a typical home network
const char* ssid = "MyWiFi";
const char* password = "mypassword123";
const char* serverUrl = "http://192.168.1.105:3000/api/device-data";
const char* deviceSerial = "ESP32-001";
const char* pairingCode = "XYZ789";
```

## Testing the Connection

1. **ESP32 Serial Monitor** should show:
   - Wi-Fi connection success
   - Sensor initialization
   - "Data sent successfully" messages

2. **Web App** should show:
   - Device appears in "Devices" page
   - Device status shows "Online"
   - Real-time data in sessions

3. **Network Test** (optional):
   ```bash
   # Test if ESP32 can reach your computer
   ping 192.168.1.105
   ```

## Next Steps

Once connected:
1. **Start a session** to see real-time data
2. **Monitor device status** in the Devices page
3. **Generate reports** from your breathing sessions
4. **Add more devices** using the same process

Your ESP32 is now connected to your local ROVOCS web app! 🎉
