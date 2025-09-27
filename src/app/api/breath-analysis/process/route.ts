import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { BreathAnalyzer, SensorReading } from '../../../../lib/breath-analysis'

// POST /api/breath-analysis/process - Process sensor data for breath analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      sessionId, 
      deviceId, 
      tvoc, 
      eco2, 
      temperature, 
      humidity 
    } = body

    if (!sessionId || !deviceId || tvoc === undefined || eco2 === undefined) {
      return NextResponse.json(
        { error: 'sessionId, deviceId, tvoc, and eco2 are required' },
        { status: 400 }
      )
    }

    // Verify session exists and is active
    const session = await prisma.breathSession.findUnique({
      where: { id: sessionId },
      include: { device: true }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (!session.isActive) {
      return NextResponse.json({ error: 'Session is not active' }, { status: 400 })
    }

    // Create sensor reading
    const reading: SensorReading = {
      id: '', // Will be set by database
      tvoc: parseFloat(tvoc),
      eco2: parseFloat(eco2),
      temperature: parseFloat(temperature || 0),
      humidity: parseFloat(humidity || 0),
      recordedAt: new Date()
    }

    // Store reading in database
    const dbReading = await prisma.reading.create({
      data: {
        deviceId,
        tvoc: reading.tvoc,
        eco2: reading.eco2,
        temperature: reading.temperature,
        humidity: reading.humidity,
        statusMsg: 'Breath analysis reading'
      }
    })

    reading.id = dbReading.id

    // Get recent readings for analysis
    const recentReadings = await prisma.reading.findMany({
      where: {
        deviceId,
        recordedAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      },
      orderBy: { recordedAt: 'asc' }
    })

    // Convert to SensorReading format
    const sensorReadings: SensorReading[] = recentReadings.map(r => ({
      id: r.id,
      tvoc: r.tvoc,
      eco2: r.eco2,
      temperature: r.temperature,
      humidity: r.humidity,
      recordedAt: r.recordedAt
    }))

    // Initialize breath analyzer
    const analyzer = new BreathAnalyzer()
    
    // Process all recent readings
    let latestResult: {
      baseline?: {
        tvoc: number
        eco2: number
        sampleCount: number
        isStable: boolean
        lastUpdated: Date
      }
      event?: {
        startTime: Date
        endTime?: Date
        peakTime?: Date
        peakTvoc?: number
        peakEco2?: number
        baselineTvoc: number
        baselineEco2: number
        isComplete: boolean
      }
      metrics?: Array<{
        metricType: string
        baseline: number
        peak: number
        peakPercent: number
        timeToPeak?: number
        slope?: number
        recoveryTime?: number
        threshold?: number
      }>
    } = {}
    for (const sensorReading of sensorReadings) {
      const result = analyzer.addReading(sensorReading)
      if (result.baseline || result.event || result.metrics) {
        latestResult = result
      }
    }

    const response: {
      reading: {
        id: string
        deviceId: string
        tvoc: number
        eco2: number
        temperature: number
        humidity: number
        statusMsg: string | null
        recordedAt: Date
      }
      baseline?: {
        tvoc: number
        eco2: number
        sampleCount: number
        isStable: boolean
        lastUpdated: Date
      }
      currentEvent?: {
        startTime: Date
        endTime?: Date
        peakTime?: Date
        peakTvoc?: number
        peakEco2?: number
        baselineTvoc: number
        baselineEco2: number
        isComplete: boolean
      }
      metrics?: Array<{
        metricType: string
        baseline: number
        peak: number
        peakPercent: number
        timeToPeak?: number
        slope?: number
        recoveryTime?: number
        threshold?: number
      }>
      breathEvent?: {
        id: string
        sessionId: string
        startTime: Date
        endTime?: Date | null
        peakTime?: Date | null
        peakTvoc?: number | null
        peakEco2?: number | null
        baselineTvoc: number
        baselineEco2: number
        isComplete: boolean
        createdAt: Date
      }
      breathMetrics?: Array<{
        id: string
        sessionId: string
        eventId?: string | null
        metricType: string
        baseline: number
        peak: number
        peakPercent: number
        timeToPeak?: number | null
        slope?: number | null
        recoveryTime?: number | null
        threshold?: number | null
        calculatedAt: Date
      }>
    } = {
      reading: dbReading,
      baseline: latestResult.baseline,
      currentEvent: latestResult.event,
      metrics: latestResult.metrics
    }

    // Update session baseline if available
    if (latestResult.baseline?.isStable) {
      await prisma.breathSession.update({
        where: { id: sessionId },
        data: {
          baselineTvoc: latestResult.baseline.tvoc,
          baselineEco2: latestResult.baseline.eco2
        }
      })
    }

    // Create breath event if detected
    if (latestResult.event) {
      const breathEvent = await prisma.breathEvent.create({
        data: {
          sessionId,
          startTime: latestResult.event.startTime,
          endTime: latestResult.event.endTime,
          peakTime: latestResult.event.peakTime,
          peakTvoc: latestResult.event.peakTvoc,
          peakEco2: latestResult.event.peakEco2,
          baselineTvoc: latestResult.event.baselineTvoc,
          baselineEco2: latestResult.event.baselineEco2,
          isComplete: latestResult.event.isComplete
        }
      })

      response.breathEvent = breathEvent
    }

    // Store breath metrics if available
    if (latestResult.metrics && latestResult.metrics.length > 0) {
      const metrics = await Promise.all(
        latestResult.metrics.map((metric: {
          metricType: string
          baseline: number
          peak: number
          peakPercent: number
          timeToPeak?: number
          slope?: number
          recoveryTime?: number
          threshold?: number
        }) =>
          prisma.breathMetrics.create({
            data: {
              sessionId,
              eventId: response.breathEvent?.id,
              metricType: metric.metricType,
              baseline: metric.baseline,
              peak: metric.peak,
              peakPercent: metric.peakPercent,
              timeToPeak: metric.timeToPeak,
              slope: metric.slope,
              recoveryTime: metric.recoveryTime,
              threshold: metric.threshold
            }
          })
        )
      )

      response.breathMetrics = metrics
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error processing breath analysis:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
