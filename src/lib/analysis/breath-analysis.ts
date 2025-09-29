/**
 * ROVOCS Breath Analysis Algorithms
 * 
 * Implements the mathematical formulas for breath analysis as outlined in
 * docs/breath-analysis-formulas.md
 */

export interface SensorReading {
  id: string
  tvoc: number
  eco2: number
  temperature: number
  humidity: number
  recordedAt: Date
}

export interface BaselineData {
  tvoc: number
  eco2: number
  sampleCount: number
  isStable: boolean
  lastUpdated: Date
}

export interface BreathEvent {
  startTime: Date
  endTime?: Date
  peakTime?: Date
  peakTvoc?: number
  peakEco2?: number
  baselineTvoc: number
  baselineEco2: number
  isComplete: boolean
}

export interface BreathMetrics {
  metricType: 'tvoc' | 'eco2'
  baseline: number
  peak: number
  peakPercent: number
  timeToPeak?: number
  slope?: number
  recoveryTime?: number
  threshold?: number
}

export class BreathAnalyzer {
  private readings: SensorReading[] = []
  private baseline: BaselineData
  private currentEvent?: BreathEvent
  private readonly samplingRate: number = 0.5 // 2 seconds between readings
  private readonly baselineWindowSize: number = 30 // 30 readings for baseline (60 seconds)
  private readonly stabilityThreshold: number = 0.03 // 3% variation threshold
  private readonly stabilityDuration: number = 10 // 10 readings (20 seconds) for stability
  private readonly recoveryThreshold: number = 0.05 // 5% of baseline for recovery
  private readonly breathThreshold: number = 0.15 // 15% increase to detect breath start

  constructor() {
    this.baseline = {
      tvoc: 0,
      eco2: 0,
      sampleCount: 0,
      isStable: false,
      lastUpdated: new Date()
    }
  }

  /**
   * Add a new sensor reading and process it
   */
  addReading(reading: SensorReading): {
    baseline?: BaselineData
    event?: BreathEvent
    metrics?: BreathMetrics[]
  } {
    this.readings.push(reading)
    
    // Keep only recent readings (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    this.readings = this.readings.filter(r => r.recordedAt > fiveMinutesAgo)

    const result: {
      baseline?: BaselineData
      event?: BreathEvent
      metrics?: BreathMetrics[]
    } = {}

    // Update baseline
    this.updateBaseline()
    if (this.baseline.isStable) {
      result.baseline = { ...this.baseline }
    }

    // Detect breath events
    const breathDetected = this.detectBreathEvent(reading)
    if (breathDetected) {
      result.event = { ...this.currentEvent! }
    }

    // Calculate metrics if event is complete
    if (this.currentEvent?.isComplete) {
      result.metrics = this.calculateBreathMetrics()
    }

    return result
  }

  /**
   * 1. Baseline (True Ambient Baseline)
   * Formula: Baseline = x̄_baseline = (1/m) * Σ(x_i) from i=1 to m
   */
  private updateBaseline(): void {
    if (this.readings.length < this.baselineWindowSize) {
      return
    }

    // Get recent readings for baseline calculation
    const recentReadings = this.readings.slice(-this.baselineWindowSize)
    
    // Calculate rolling average
    const tvocSum = recentReadings.reduce((sum, r) => sum + r.tvoc, 0)
    const eco2Sum = recentReadings.reduce((sum, r) => sum + r.eco2, 0)
    
    const newTvocBaseline = tvocSum / recentReadings.length
    const newEco2Baseline = eco2Sum / recentReadings.length

    // Check for stability (less than 3% variation for 20 seconds)
    const tvocVariation = Math.abs(newTvocBaseline - this.baseline.tvoc) / this.baseline.tvoc
    const eco2Variation = Math.abs(newEco2Baseline - this.baseline.eco2) / this.baseline.eco2

    if (tvocVariation < this.stabilityThreshold && eco2Variation < this.stabilityThreshold) {
      this.baseline.sampleCount++
    } else {
      this.baseline.sampleCount = 0
    }

    this.baseline.tvoc = newTvocBaseline
    this.baseline.eco2 = newEco2Baseline
    this.baseline.sampleCount++
    this.baseline.lastUpdated = new Date()

    // Mark as stable if variation is low for required duration
    this.baseline.isStable = this.baseline.sampleCount >= this.stabilityDuration
  }

  /**
   * Detect breath events based on signal increase
   */
  private detectBreathEvent(reading: SensorReading): boolean {
    if (!this.baseline.isStable) {
      return false
    }

    // Check for breath start (15% increase from baseline)
    const tvocIncrease = (reading.tvoc - this.baseline.tvoc) / this.baseline.tvoc
    const eco2Increase = (reading.eco2 - this.baseline.eco2) / this.baseline.eco2

    const isBreathStart = tvocIncrease > this.breathThreshold || eco2Increase > this.breathThreshold

    if (isBreathStart && !this.currentEvent) {
      // Start new breath event
      this.currentEvent = {
        startTime: reading.recordedAt,
        baselineTvoc: this.baseline.tvoc,
        baselineEco2: this.baseline.eco2,
        isComplete: false
      }
      return true
    }

    if (this.currentEvent && !this.currentEvent.isComplete) {
      // Update peak values
      if (!this.currentEvent.peakTvoc || reading.tvoc > this.currentEvent.peakTvoc) {
        this.currentEvent.peakTvoc = reading.tvoc
        this.currentEvent.peakTime = reading.recordedAt
      }
      if (!this.currentEvent.peakEco2 || reading.eco2 > this.currentEvent.peakEco2) {
        this.currentEvent.peakEco2 = reading.eco2
      }

      // Check for breath end (return to near baseline)
      const tvocRecovery = Math.abs(reading.tvoc - this.baseline.tvoc) / this.baseline.tvoc
      const eco2Recovery = Math.abs(reading.eco2 - this.baseline.eco2) / this.baseline.eco2

      if (tvocRecovery < this.recoveryThreshold && eco2Recovery < this.recoveryThreshold) {
        this.currentEvent.endTime = reading.recordedAt
        this.currentEvent.isComplete = true
        return true
      }
    }

    return false
  }

  /**
   * Calculate all breath analysis metrics for completed events
   */
  private calculateBreathMetrics(): BreathMetrics[] {
    if (!this.currentEvent?.isComplete) {
      return []
    }

    const metrics: BreathMetrics[] = []

    // Calculate TVOC metrics
    if (this.currentEvent.peakTvoc) {
      metrics.push(this.calculateMetric('tvoc', this.currentEvent.peakTvoc, this.currentEvent.baselineTvoc))
    }

    // Calculate eCO2 metrics
    if (this.currentEvent.peakEco2) {
      metrics.push(this.calculateMetric('eco2', this.currentEvent.peakEco2, this.currentEvent.baselineEco2))
    }

    return metrics
  }

  /**
   * Calculate individual metric for a sensor type
   */
  private calculateMetric(type: 'tvoc' | 'eco2', peak: number, baseline: number): BreathMetrics {
    const metric: BreathMetrics = {
      metricType: type,
      baseline,
      peak,
      peakPercent: 0,
      timeToPeak: undefined,
      slope: undefined,
      recoveryTime: undefined,
      threshold: undefined
    }

    // 3. Peak % (Percent Increase Over Baseline)
    // Formula: Peak% = ((Peak - Baseline) / Baseline) * 100%
    metric.peakPercent = ((peak - baseline) / baseline) * 100

    // 4. Tpeak (Time to Peak)
    // Formula: T_peak = (k - k_0) / f_s seconds
    if (this.currentEvent?.startTime && this.currentEvent?.peakTime) {
      const timeDiff = this.currentEvent.peakTime.getTime() - this.currentEvent.startTime.getTime()
      metric.timeToPeak = timeDiff / 1000 // Convert to seconds
    }

    // 5. Slope (Rate of Rise to Peak)
    // Formula: Slope = (Peak - Baseline) / T_peak
    if (metric.timeToPeak && metric.timeToPeak > 0) {
      metric.slope = (peak - baseline) / metric.timeToPeak
    }

    // 6. Trec (Recovery Time)
    // Formula: T_rec = time from Peak to first t where x(t) <= Threshold
    // Threshold = Baseline + 0.05 × Baseline
    if (this.currentEvent?.peakTime && this.currentEvent?.endTime) {
      const recoveryTime = this.currentEvent.endTime.getTime() - this.currentEvent.peakTime.getTime()
      metric.recoveryTime = recoveryTime / 1000 // Convert to seconds
      metric.threshold = baseline + (0.05 * baseline)
    }

    return metric
  }

  /**
   * Get current baseline data
   */
  getBaseline(): BaselineData {
    return { ...this.baseline }
  }

  /**
   * Get current breath event
   */
  getCurrentEvent(): BreathEvent | undefined {
    return this.currentEvent ? { ...this.currentEvent } : undefined
  }

  /**
   * Clear current breath event
   */
  clearCurrentEvent(): void {
    this.currentEvent = undefined
  }

  /**
   * Get recent readings for analysis
   */
  getRecentReadings(minutes: number = 5): SensorReading[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000)
    return this.readings.filter(r => r.recordedAt > cutoff)
  }

  /**
   * Reset analyzer state
   */
  reset(): void {
    this.readings = []
    this.baseline = {
      tvoc: 0,
      eco2: 0,
      sampleCount: 0,
      isStable: false,
      lastUpdated: new Date()
    }
    this.currentEvent = undefined
  }
}

/**
 * Utility functions for breath analysis
 */
export class BreathAnalysisUtils {
  /**
   * Detect exhalation start based on signal increase
   */
  static detectExhalationStart(
    currentReading: SensorReading,
    baseline: BaselineData,
    threshold: number = 0.15
  ): boolean {
    if (!baseline.isStable) return false

    const tvocIncrease = (currentReading.tvoc - baseline.tvoc) / baseline.tvoc
    const eco2Increase = (currentReading.eco2 - baseline.eco2) / baseline.eco2

    return tvocIncrease > threshold || eco2Increase > threshold
  }

  /**
   * Detect exhalation end based on signal return to baseline
   */
  static detectExhalationEnd(
    currentReading: SensorReading,
    baseline: BaselineData,
    threshold: number = 0.05
  ): boolean {
    if (!baseline.isStable) return false

    const tvocRecovery = Math.abs(currentReading.tvoc - baseline.tvoc) / baseline.tvoc
    const eco2Recovery = Math.abs(currentReading.eco2 - baseline.eco2) / baseline.eco2

    return tvocRecovery < threshold && eco2Recovery < threshold
  }

  /**
   * Calculate signal quality score (0-100)
   */
  static calculateSignalQuality(
    reading: SensorReading,
    baseline: BaselineData
  ): number {
    if (!baseline.isStable) return 0

    // Check for reasonable values
    const tvocReasonable = reading.tvoc > 0 && reading.tvoc < 10000
    const eco2Reasonable = reading.eco2 > 0 && reading.eco2 < 10000
    const tempReasonable = reading.temperature > -10 && reading.temperature < 60
    const humidityReasonable = reading.humidity >= 0 && reading.humidity <= 100

    let quality = 100

    if (!tvocReasonable) quality -= 25
    if (!eco2Reasonable) quality -= 25
    if (!tempReasonable) quality -= 25
    if (!humidityReasonable) quality -= 25

    return Math.max(0, quality)
  }

  /**
   * Get breath quality assessment
   */
  static assessBreathQuality(metrics: BreathMetrics[]): {
    overall: 'excellent' | 'fair' | 'poor'
    tvocScore: number
    eco2Score: number
    recommendations: string[]
  } {
    const tvocMetric = metrics.find(m => m.metricType === 'tvoc')
    const eco2Metric = metrics.find(m => m.metricType === 'eco2')

    const recommendations: string[] = []
    let tvocScore = 0
    let eco2Score = 0

    if (tvocMetric) {
      // Score based on peak percentage and recovery time
      if (tvocMetric.peakPercent > 25 && tvocMetric.recoveryTime && tvocMetric.recoveryTime < 20) {
        tvocScore = 100 // Combined good and excellent (>= 25%)
      } else if (tvocMetric.peakPercent > 10) {
        tvocScore = 50
      } else {
        tvocScore = 25
        recommendations.push('Low VOC concentration detected. Try deeper breathing.')
      }
    }

    if (eco2Metric) {
      // Score based on peak percentage and recovery time
      if (eco2Metric.peakPercent > 15 && eco2Metric.recoveryTime && eco2Metric.recoveryTime < 30) {
        eco2Score = 100 // Combined good and excellent (>= 15%)
      } else if (eco2Metric.peakPercent > 5) {
        eco2Score = 50
      } else {
        eco2Score = 25
        recommendations.push('Low CO2 concentration detected. Ensure proper exhalation.')
      }
    }

    const overallScore = (tvocScore + eco2Score) / 2
    let overall: 'excellent' | 'fair' | 'poor'

    if (overallScore >= 70) {
      overall = 'excellent' // Combined good and excellent categories
    } else if (overallScore >= 50) {
      overall = 'fair'
    } else {
      overall = 'poor'
    }

    if (overall === 'poor') {
      recommendations.push('Consider consulting a healthcare professional for respiratory assessment.')
    }

    return {
      overall,
      tvocScore,
      eco2Score,
      recommendations
    }
  }
}
