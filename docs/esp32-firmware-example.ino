/*
 * ROVOCS ESP32 Firmware Example
 * 
 * This example shows how to connect an ESP32 device to the ROVOCS web app.
 * 
 * Hardware Requirements:
 * - ESP32 Development Board
 * - MQ-135 Gas Sensor (VOC detection)
 * - SGP30 Air Quality Sensor (TVOC, eCO2)
 * - BME280 Environmental Sensor (Temperature, Humidity)
 * 
 * Wiring:
 * MQ-135: A0 -> GPIO36 (ADC1_CH0)
 * SGP30: SDA -> GPIO21, SCL -> GPIO22
 * BME280: SDA -> GPIO21, SCL -> GPIO22
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_SGP30.h>
#include <Adafruit_BME280.h>

// Wi-Fi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// ROVOCS Server Configuration
const char* serverUrl = "http://your-domain.com/api/device-data";
const char* deviceSerial = "ESP32-001";  // Change this to your device serial
const char* pairingCode = "ABC123";      // Get this from the web app

// Sensor Objects
Adafruit_SGP30 sgp;
Adafruit_BME280 bme;

// Sensor Pins
#define MQ135_PIN A0

// Data sending interval (milliseconds)
const unsigned long SEND_INTERVAL = 2000; // 2 seconds
unsigned long lastSendTime = 0;

// Sensor data structure
struct SensorData {
  float tvoc;
  float eco2;
  float temperature;
  float humidity;
  String statusMsg;
};

void setup() {
  Serial.begin(115200);
  
  // Initialize sensors
  initializeSensors();
  
  // Connect to Wi-Fi
  connectToWiFi();
  
  // Register device with server
  registerDevice();
  
  Serial.println("ROVOCS ESP32 Device Ready!");
}

void loop() {
  // Check Wi-Fi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi disconnected. Reconnecting...");
    connectToWiFi();
    return;
  }
  
  // Send data at regular intervals
  if (millis() - lastSendTime >= SEND_INTERVAL) {
    sendSensorData();
    lastSendTime = millis();
  }
  
  delay(100);
}

void initializeSensors() {
  Serial.println("Initializing sensors...");
  
  // Initialize I2C
  Wire.begin();
  
  // Initialize SGP30
  if (!sgp.begin()) {
    Serial.println("SGP30 sensor not found!");
  } else {
    Serial.println("SGP30 initialized");
  }
  
  // Initialize BME280
  if (!bme.begin(0x76)) {
    Serial.println("BME280 sensor not found!");
  } else {
    Serial.println("BME280 initialized");
  }
  
  Serial.println("Sensor initialization complete");
}

void connectToWiFi() {
  WiFi.begin(ssid, password);
  
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("Wi-Fi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void registerDevice() {
  // Check if device is registered with server
  HTTPClient http;
  http.begin(String(serverUrl) + "?serial=" + deviceSerial + "&code=" + pairingCode);
  
  int httpCode = http.GET();
  if (httpCode == HTTP_CODE_OK) {
    String response = http.getString();
    Serial.println("Device registration check: " + response);
  } else {
    Serial.println("Device registration check failed: " + String(httpCode));
  }
  
  http.end();
}

void sendSensorData() {
  SensorData data = readAllSensors();
  
  // Create JSON payload
  String jsonPayload = "{";
  jsonPayload += "\"deviceSerial\":\"" + String(deviceSerial) + "\",";
  jsonPayload += "\"pairingCode\":\"" + String(pairingCode) + "\",";
  jsonPayload += "\"tvoc\":" + String(data.tvoc) + ",";
  jsonPayload += "\"eco2\":" + String(data.eco2) + ",";
  jsonPayload += "\"temperature\":" + String(data.temperature) + ",";
  jsonPayload += "\"humidity\":" + String(data.humidity) + ",";
  jsonPayload += "\"statusMsg\":\"" + data.statusMsg + "\"";
  jsonPayload += "}";
  
  // Send HTTP POST request
  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  int httpCode = http.POST(jsonPayload);
  
  if (httpCode == HTTP_CODE_OK) {
    String response = http.getString();
    Serial.println("Data sent successfully: " + response);
  } else {
    Serial.println("HTTP POST failed: " + String(httpCode));
  }
  
  http.end();
}

SensorData readAllSensors() {
  SensorData data;
  
  // Read MQ-135 (VOC sensor)
  int mq135Value = analogRead(MQ135_PIN);
  data.tvoc = map(mq135Value, 0, 4095, 0, 1000); // Convert to ppb
  
  // Read SGP30
  if (sgp.IAQmeasure()) {
    data.tvoc = sgp.TVOC;
    data.eco2 = sgp.eCO2;
  } else {
    data.tvoc = 0;
    data.eco2 = 0;
  }
  
  // Read BME280
  data.temperature = bme.readTemperature();
  data.humidity = bme.readHumidity();
  
  // Set default status message
  data.statusMsg = "Data received";
  
  // Print sensor readings to serial
  Serial.println("=== Sensor Readings ===");
  Serial.println("TVOC: " + String(data.tvoc) + " ppb");
  Serial.println("eCO2: " + String(data.eco2) + " ppm");
  Serial.println("Temperature: " + String(data.temperature) + " °C");
  Serial.println("Humidity: " + String(data.humidity) + " %");
  Serial.println("Status: " + data.statusMsg);
  Serial.println("========================");
  
  return data;
}

/*
 * Required Libraries (install via Arduino IDE Library Manager):
 * - WiFi (built-in)
 * - HTTPClient (built-in)
 * - Wire (built-in)
 * - Adafruit SGP30
 * - Adafruit BME280
 * 
 * Installation Steps:
 * 1. Install Arduino IDE
 * 2. Install ESP32 board package
 * 3. Install required libraries
 * 4. Upload this code to your ESP32
 * 5. Open Serial Monitor to see debug output
 * 6. Configure Wi-Fi credentials
 * 7. Get pairing code from ROVOCS web app
 * 8. Update deviceSerial and pairingCode variables
 */

