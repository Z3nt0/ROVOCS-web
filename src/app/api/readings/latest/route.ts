import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/database/prisma'

// GET /api/readings/latest - Get the latest reading for a device (for real-time sessions)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 })
    }

    // Get the latest reading for the device
    const latestReading = await prisma.reading.findFirst({
      where: { deviceId },
      include: {
        device: {
          select: {
            id: true,
            name: true,
            serial: true
          }
        }
      },
      orderBy: { recordedAt: 'desc' }
    })

    if (!latestReading) {
      return NextResponse.json({ error: 'No readings found for this device' }, { status: 404 })
    }

    // Check if the reading is recent (within last 5 minutes)
    const now = new Date()
    const readingTime = new Date(latestReading.recordedAt)
    const timeDiff = now.getTime() - readingTime.getTime()
    const isRecent = timeDiff < 5 * 60 * 1000 // 5 minutes

    return NextResponse.json({
      reading: latestReading,
      isRecent: isRecent,
      timeSinceReading: Math.floor(timeDiff / 1000) // seconds
    })
  } catch (error) {
    console.error('Error fetching latest reading:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}






