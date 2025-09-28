#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include "Adafruit_SGP30.h"
#include <Adafruit_BME280.h>
#include <Adafruit_Sensor.h>

Adafruit_SGP30 sgp;
Adafruit_BME280 bme;

// Wi-Fi Configuration
const char* ssid = "TP-Link_F718";        // Change this to your Wi-Fi name
const char* password = "94768480"; // Change this to your Wi-Fi password

// ROVOCS Server Configuration (localhost)
const char* serverUrl = "http://192.168.0.183:3000/api/device-data"; // Change IP to your computer's IP
const char* deviceSerial = "0C77842B1838";  // Change this to your device serial
const char* pairingCode = "FXBNW0";      // Get this from the web app

// Configurable pins
#define SDA_PIN 21
#define SCL_PIN 22
#define MQ135_PIN 34   // ESP32 ADC pin

// Data sending configuration
const unsigned long SEND_INTERVAL = 2000; // Send data every 2 seconds
unsigned long lastSendTime = 0;
bool wifiConnected = false;

// Baseline storage
float baseline_TVOC = 0;
float baseline_eCO2 = 0;
float baseline_MQ135 = 0;
int baselineSamples = 0;
bool baselineCaptured = false;

unsigned long startTime;

void connectToWiFi() {
  WiFi.begin(ssid, password);
  
  Serial.print("Connecting to Wi-Fi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("Wi-Fi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    wifiConnected = true;
  } else {
    Serial.println();
    Serial.println("Wi-Fi connection failed!");
    wifiConnected = false;
  }
}

void sendSensorData(float tvoc, float eco2, float temp, float hum, int mq135_adc) {
  if (!wifiConnected || WiFi.status() != WL_CONNECTED) {
    return;
  }

  HTTPClient http;
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  // Create JSON payload
  String jsonPayload = "{";
  jsonPayload += "\"deviceSerial\":\"" + String(deviceSerial) + "\",";
  jsonPayload += "\"pairingCode\":\"" + String(pairingCode) + "\",";
  jsonPayload += "\"tvoc\":" + String(tvoc) + ",";
  jsonPayload += "\"eco2\":" + String(eco2) + ",";
  jsonPayload += "\"temperature\":" + String(temp) + ",";
  jsonPayload += "\"humidity\":" + String(hum) + ",";
  jsonPayload += "\"statusMsg\":\"Data from ESP32\"";
  jsonPayload += "}";

  int httpCode = http.POST(jsonPayload);
  
  if (httpCode == HTTP_CODE_OK) {
    String response = http.getString();
    Serial.println("Data sent successfully: " + response);
  } else {
    Serial.println("HTTP POST failed: " + String(httpCode));
  }
  
  http.end();
}

void i2cScannerOnce() {
  Serial.println("\nI2C Scanner (one-shot):");
  bool foundAny = false;
  for (uint8_t addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.print("  - Found device at 0x");
      if (addr < 16) Serial.print("0");
      Serial.println(addr, HEX);
      foundAny = true;
    }
    delay(2);
  }
  if (!foundAny) Serial.println("  -> No I2C devices found. Check wiring/pull-ups.");
}

bool tryInitSGP30(int attempts = 3, int delayMs = 500) {
  for (int i = 0; i < attempts; ++i) {
    if (sgp.begin()) return true;
    Serial.print("SGP30 init attempt ");
    Serial.print(i+1);
    Serial.println(" failed. Retrying...");
    delay(delayMs);
  }
  return false;
}

bool tryInitBME280(int attempts = 3, int delayMs = 500) {
  for (int i = 0; i < attempts; ++i) {
    if (bme.begin(0x76) || bme.begin(0x77)) return true;
    Serial.print("BME280 init attempt ");
    Serial.print(i+1);
    Serial.println(" failed. Retrying...");
    delay(delayMs);
  }
  return false;
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Connect to Wi-Fi first
  connectToWiFi();

  // Initialize I2C with explicit pins and clock
  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setClock(100000); // 100 kHz

  // Show I2C devices before attempting sensor init
  i2cScannerOnce();

  // Try to init SGP30 with retries
  if (!tryInitSGP30(5, 500)) {
    Serial.println("{\"error\":\"SGP30 not found. Check wiring and pull-ups!\"}");
    // we continue so you can still use other sensors; comment 'return' if you want to stop
    // return;
  } else {
    Serial.println("{\"message\":\"SGP30 sensor initialized.\"}");
  }

  // Try to init BME280 with retries
  if (!tryInitBME280(5, 500)) {
    Serial.println("{\"error\":\"BME280 not found. Check wiring and pull-ups!\"}");
    // return;
  } else {
    Serial.println("{\"message\":\"BME280 sensor initialized.\"}");
  }

  // Start timer
  startTime = millis();

  // Notify start
  Serial.println("{\"message\":\"ROVOCS ESP32 Device Ready!\"}");
  Serial.println("{\"message\":\"Starting sensor readings and data transmission\"}");
}

void loop() {
  unsigned long currentTime = millis();

  // Check Wi-Fi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi disconnected. Reconnecting...");
    connectToWiFi();
    return;
  }

  // Read SGP30 (only if it initialized)
  float tvoc = -1.0;
  float eco2 = -1.0;
  if (sgp.begin()) { // quick-check: calling begin() again is not ideal but ensures object is usable; better track a flag after init
    if (!sgp.IAQmeasure()) {
      Serial.println("{\"error\":\"SGP30 measurement failed\"}");
      // don't return; still attempt other sensors
    } else {
      tvoc = sgp.TVOC;
      eco2 = sgp.eCO2;
    }
  }

  // Read BME280 (only if it initialized)
  float temp = NAN;
  float hum = NAN;
  if (bme.begin(0x76) || bme.begin(0x77)) {
    temp = bme.readTemperature();
    hum = bme.readHumidity();
  }

  // Read MQ135
  int mq135_adc = analogRead(MQ135_PIN);

  // Capture 60-second baseline (only accumulate valid readings)
  if (!baselineCaptured) {
    if (currentTime <= 60000) {
      if (tvoc >= 0) baseline_TVOC += tvoc;
      if (eco2 >= 0) baseline_eCO2 += eco2;
      baseline_MQ135 += mq135_adc;
      baselineSamples++;
    } else if (baselineSamples > 0) {
      // compute averages
      // protect divides
      float samplesF = (float)baselineSamples;
      if (samplesF > 0.0) {
        baseline_TVOC /= samplesF;
        baseline_eCO2 /= samplesF;
        baseline_MQ135 /= samplesF;
      }
      baselineCaptured = true;

      // Print baseline values as JSON
      Serial.print("{\"message\":\"Baseline captured\",");
      Serial.print("\"baseline_TVOC\":"); Serial.print(baseline_TVOC); Serial.print(",");
      Serial.print("\"baseline_eCO2\":"); Serial.print(baseline_eCO2); Serial.print(",");
      Serial.print("\"baseline_MQ135\":"); Serial.print(baseline_MQ135);
      Serial.println("}");
    }
  }

  // Send data to web app at regular intervals
  if (currentTime - lastSendTime >= SEND_INTERVAL) {
    // Use valid sensor readings or defaults
    float finalTvoc = (tvoc >= 0) ? tvoc : 0.0;
    float finalEco2 = (eco2 >= 0) ? eco2 : 0.0;
    float finalTemp = (!isnan(temp)) ? temp : 25.0;
    float finalHum = (!isnan(hum)) ? hum : 50.0;
    
    sendSensorData(finalTvoc, finalEco2, finalTemp, finalHum, mq135_adc);
    lastSendTime = currentTime;
  }

  // Output sensor readings as a JSON object (for debugging)
  Serial.print("{");
  Serial.print("\"time_ms\":"); Serial.print(currentTime); Serial.print(",");
  Serial.print("\"TVOC_ppb\":"); Serial.print(tvoc); Serial.print(",");
  Serial.print("\"eCO2_ppm\":"); Serial.print(eco2); Serial.print(",");
  Serial.print("\"MQ135_ADC\":"); Serial.print(mq135_adc); Serial.print(",");
  Serial.print("\"Temp_C\":");
  if (!isnan(temp)) Serial.print(temp); else Serial.print("null");
  Serial.print(",");
  Serial.print("\"RH_pct\":");
  if (!isnan(hum)) Serial.print(hum); else Serial.print("null");
  Serial.print("}");
  Serial.println();

  delay(1000); // log once per second
}
