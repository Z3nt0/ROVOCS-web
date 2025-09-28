# ROVOCS Breath Analysis Formulas

This document outlines the mathematical formulas used in the ROVOCS breath analysis system for processing sensor data and extracting meaningful respiratory health metrics.

## Core Analysis Formulas

### 1. Baseline (True Ambient Baseline)

**Purpose**: Establish the true ambient baseline for accurate breath analysis.

**Method**: Compute the rolling average of a signal `x(t)` over a designated baseline period.

**Formula**:
```
Baseline = x̄_baseline = (1/m) * Σ(x_i) from i=1 to m
```

Where:
- `m` = number of baseline samples
- `x_i` = individual sample values during baseline period

**Implementation Notes**:
- Often uses a moving average approach
- Baseline is "locked" when change is less than 3% for 20 seconds
- Example: "The 60s before the breath"

---

### 2. Peak

**Purpose**: Identify the maximum concentration during exhalation.

**Definition**: The maximum value of `x(t)` during the exhalation window.

**Formula**:
```
Peak = max x(t) where t ∈ exhale
```

Where:
- `t` = time during exhalation period
- `x(t)` = signal value at time t

---

### 3. Peak % (Percent Increase Over Baseline)

**Purpose**: Quantify the relative increase in concentration compared to baseline.

**Formula**:
```
Peak% = ((Peak - Baseline) / Baseline) * 100%
```

**Interpretation**:
- Positive values indicate increase above baseline
- Higher percentages suggest higher VOC concentrations in breath
- Useful for comparing different breath samples

---

### 4. Tpeak (Time to Peak)

**Purpose**: Measure the time elapsed from start of exhalation to peak concentration.

**Definition**: Time elapsed from the start of exhalation to the time the Peak occurs.

**Formula**:
```
T_peak = (k - k_0) / f_s seconds
```

Where:
- `k` = sample number where peak occurs
- `k_0` = sample number where exhalation started
- `f_s` = sampling rate (samples per second)

**Clinical Significance**:
- Shorter T_peak may indicate faster gas exchange
- Longer T_peak may suggest respiratory issues

---

### 5. Slope (Rate of Rise to Peak)

**Purpose**: Measure the rate of concentration increase from baseline to peak.

**Definition**: Rate of change from baseline to peak.

**Formula**:
```
Slope = (Peak - Baseline) / T_peak
```

**Units**: ppb/s or ppm/s (depending on sensor type)

**Clinical Significance**:
- Steeper slopes may indicate more concentrated breath samples
- Gradual slopes may suggest slower exhalation or lower concentrations

---

### 6. Trec (Recovery Time)

**Purpose**: Measure how quickly the signal returns to baseline after peak.

**Definition**: Time from the Peak until the signal returns to near-baseline.

**Threshold Formula**:
```
Threshold = Baseline + 0.05 × Baseline
```

**Recovery Time Formula**:
```
T_rec = time from Peak to first t where x(t) <= Threshold
```

**Parameters**:
- Recovery threshold: 5% of baseline (adjustable: 2%-10% depending on noise)
- `x(t)` = signal value at time t

**Clinical Significance**:
- Shorter recovery times may indicate better lung function
- Longer recovery times may suggest retention of VOCs in the respiratory system

---

## Implementation Guidelines

### Signal Processing Pipeline

1. **Data Collection**: Collect continuous sensor readings at appropriate sampling rate
2. **Baseline Detection**: Identify stable baseline period (typically 60 seconds)
3. **Exhalation Detection**: Identify start and end of breath exhalation
4. **Peak Detection**: Find maximum value during exhalation window
5. **Recovery Analysis**: Monitor signal return to baseline

### Quality Control

- **Noise Threshold**: Use 2%-10% of baseline for recovery threshold
- **Baseline Stability**: Ensure <3% variation for 20 seconds before "locking"
- **Sampling Rate**: Maintain consistent `f_s` for accurate time calculations
- **Signal Validation**: Filter out artifacts and invalid readings

### Clinical Interpretation

- **Normal Range**: Establish baseline ranges for healthy individuals
- **Abnormal Patterns**: Identify deviations that may indicate respiratory issues
- **Trend Analysis**: Track changes over time for longitudinal health monitoring

---

## Technical Notes

### Sensor Integration

These formulas are designed to work with:
- **SGP30**: TVOC and eCO₂ measurements
- **BME280**: Temperature and humidity corrections
- **MQ-135**: Additional VOC validation

### Data Storage

All calculated metrics should be stored with:
- Timestamp of measurement
- Device identification
- User session information
- Raw sensor values for re-analysis

### Real-time Processing

For live breath analysis:
- Implement sliding window for baseline calculation
- Use efficient peak detection algorithms
- Provide immediate feedback on breath quality
- Store session data for later analysis

---

*This document serves as the mathematical foundation for the ROVOCS breath analysis system. All formulas should be implemented with appropriate error handling and validation for clinical accuracy.*
