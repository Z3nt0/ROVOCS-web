import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/database/prisma'

interface ActivityItem {
  id: string
  type: string
  title: string
  description: string
  timestamp: Date
  device?: string
  icon: string
  color: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get recent readings for the user
    const recentReadings = await prisma.reading.findMany({
      where: {
        device: {
          userId: userId
        }
      },
      include: {
        device: {
          select: {
            name: true,
            serial: true
          }
        }
      },
      orderBy: {
        recordedAt: 'desc'
      },
      take: limit
    })

    // Get recent reports for the user
    const recentReports = await prisma.report.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    // Get device connection events (devices that came online recently)
    const devices = await prisma.device.findMany({
      where: {
        userId: userId
      },
      include: {
        readings: {
          orderBy: {
            recordedAt: 'desc'
          },
          take: 1
        }
      }
    })

    // Create activity items
    const activities: ActivityItem[] = []

    // Add reading activities
    recentReadings.forEach(reading => {
      activities.push({
        id: `reading-${reading.id}`,
        type: 'reading',
        title: 'New reading recorded',
        description: `TVOC: ${reading.tvoc.toFixed(1)} ppb, eCO₂: ${reading.eco2.toFixed(0)} ppm`,
        timestamp: reading.recordedAt,
        device: reading.device.name,
        icon: 'Activity',
        color: 'blue'
      })
    })

    // Add report activities
    recentReports.forEach(report => {
      activities.push({
        id: `report-${report.id}`,
        type: 'report',
        title: 'Report generated',
        description: `Report created`,
        timestamp: report.createdAt,
        icon: 'FileText',
        color: 'purple'
      })
    })

    // Add device connection activities
    devices.forEach(device => {
      if (device.readings.length > 0) {
        const lastReading = device.readings[0]
        const isRecent = (Date.now() - new Date(lastReading.recordedAt).getTime()) < 5 * 60 * 1000 // 5 minutes
        
        if (isRecent) {
          activities.push({
            id: `device-${device.id}`,
            type: 'device',
            title: `${device.name} connected`,
            description: `Device ${device.serial} is online`,
            timestamp: lastReading.recordedAt,
            device: device.name,
            icon: 'Wifi',
            color: 'green'
          })
        }
      }
    })

    // Sort activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Return only the requested number of activities
    return NextResponse.json(activities.slice(0, limit), { status: 200 })

  } catch (error) {
    console.error('Error fetching activity data:', error)
    return NextResponse.json({ error: 'Failed to fetch activity data' }, { status: 500 })
  }
}
