import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/database/prisma'

// GET /api/dashboard/stats - Get dashboard statistics for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get user's devices
    const devices = await prisma.device.findMany({
      where: { userId },
      include: {
        readings: {
          orderBy: { recordedAt: 'desc' },
          take: 1
        }
      }
    })

    // Get total readings count
    const totalReadings = await prisma.reading.count({
      where: {
        device: { userId }
      }
    })

    // Get total reports count
    const totalReports = await prisma.report.count({
      where: { userId }
    })

    // Get recent readings (last 24 hours)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    // Get total breath sessions count
    const totalSessions = await prisma.breathSession.count({
      where: { userId }
    })

    // Get recent sessions (last 24 hours)
    const recentSessions = await prisma.breathSession.count({
      where: {
        userId,
        startTime: { gte: yesterday }
      }
    })

    const recentReadings = await prisma.reading.count({
      where: {
        device: { userId },
        recordedAt: { gte: yesterday }
      }
    })

    // Get connected devices count
    const connectedDevices = devices.filter((device: { readings: Array<{ recordedAt: Date }> }) => {
      if (!device.readings.length) return false
      const lastReading = device.readings[0]
      const timeSinceLastReading = Date.now() - lastReading.recordedAt.getTime()
      return timeSinceLastReading < 5 * 60 * 1000 // 5 minutes
    }).length

    // Get average readings for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayReadings = await prisma.reading.findMany({
      where: {
        device: { userId },
        recordedAt: { gte: today }
      },
      select: {
        tvoc: true,
        eco2: true,
        temperature: true,
        humidity: true
      }
    })

    const avgTvoc = todayReadings.length > 0 
      ? todayReadings.reduce((sum: number, r: { tvoc: number }) => sum + r.tvoc, 0) / todayReadings.length 
      : 0

    const avgEco2 = todayReadings.length > 0 
      ? todayReadings.reduce((sum: number, r: { eco2: number }) => sum + r.eco2, 0) / todayReadings.length 
      : 0

    const avgTemperature = todayReadings.length > 0 
      ? todayReadings.reduce((sum: number, r: { temperature: number }) => sum + r.temperature, 0) / todayReadings.length 
      : 0

    const avgHumidity = todayReadings.length > 0 
      ? todayReadings.reduce((sum: number, r: { humidity: number }) => sum + r.humidity, 0) / todayReadings.length 
      : 0

    return NextResponse.json({
      devices: {
        total: devices.length,
        connected: connectedDevices
      },
      readings: {
        total: totalReadings,
        recent: recentReadings
      },
      reports: {
        total: totalReports
      },
      sessions: {
        total: totalSessions,
        recent: recentSessions
      },
      averages: {
        tvoc: Math.round(avgTvoc * 100) / 100,
        eco2: Math.round(avgEco2 * 100) / 100,
        temperature: Math.round(avgTemperature * 100) / 100,
        humidity: Math.round(avgHumidity * 100) / 100
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
