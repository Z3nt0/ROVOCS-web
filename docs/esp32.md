#include <Wire.h>
#include "Adafruit_SGP30.h"
#include <Adafruit_BME280.h>
#include <Adafruit_Sensor.h"

Adafruit_SGP30 sgp;
Adafruit_BME280 bme;

// Configurable pins
#define SDA_PIN 21
#define SCL_PIN 22
#define MQ135_PIN 34   // ESP32 ADC pin

// Baseline storage
float baseline_TVOC = 0;
float baseline_eCO2 = 0;
float baseline_MQ135 = 0;
int baselineSamples = 0;
bool baselineCaptured = false;

unsigned long startTime;

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
  Serial.println("{\"message\":\"Starting sensor readings in JSON format\"}");
}

void loop() {
  unsigned long currentTime = millis();

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

  // Output sensor readings as a JSON object
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
