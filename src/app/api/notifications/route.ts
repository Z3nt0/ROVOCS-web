import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/database/prisma'

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  timestamp: Date
  isRead: boolean
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

    // Get recent readings for notifications
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
      take: 5
    })

    // Get recent reports for notifications
    const recentReports = await prisma.report.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    })

    // Get device connection events
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

    // Create notification items
    const notifications: NotificationItem[] = []

    // Add reading notifications
    recentReadings.forEach(reading => {
      notifications.push({
        id: `reading-${reading.id}`,
        type: 'reading',
        title: 'New reading recorded',
        message: `TVOC: ${reading.tvoc.toFixed(1)} ppb, eCO₂: ${reading.eco2.toFixed(0)} ppm from ${reading.device.name}`,
        timestamp: reading.recordedAt,
        isRead: false,
        icon: 'Activity',
        color: 'blue'
      })
    })

    // Add report notifications
    recentReports.forEach(report => {
      notifications.push({
        id: `report-${report.id}`,
        type: 'report',
        title: 'Report generated',
        message: `New report created for analysis`,
        timestamp: report.createdAt,
        isRead: false,
        icon: 'FileText',
        color: 'purple'
      })
    })

    // Add device connection notifications
    devices.forEach(device => {
      if (device.readings.length > 0) {
        const lastReading = device.readings[0]
        const isRecent = (Date.now() - new Date(lastReading.recordedAt).getTime()) < 10 * 60 * 1000 // 10 minutes
        
        if (isRecent) {
          notifications.push({
            id: `device-${device.id}`,
            type: 'device',
            title: `${device.name} connected`,
            message: `Device ${device.serial} is online and sending data`,
            timestamp: lastReading.recordedAt,
            isRead: false,
            icon: 'Wifi',
            color: 'green'
          })
        }
      }
    })

    // Sort notifications by timestamp (most recent first)
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Return only the requested number of notifications
    const limitedNotifications = notifications.slice(0, limit)
    const unreadCount = limitedNotifications.filter(n => !n.isRead).length

    return NextResponse.json({
      notifications: limitedNotifications,
      unreadCount: unreadCount,
      total: notifications.length
    }, { status: 200 })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, action } = body

    if (!notificationId || !action) {
      return NextResponse.json({ error: 'Notification ID and action are required' }, { status: 400 })
    }

    // Handle notification actions (mark as read, delete, etc.)
    // For now, we'll just return success since we're not persisting notification states
    // In a real app, you'd have a notifications table to track read/unread states

    return NextResponse.json({ 
      success: true, 
      message: `Notification ${action} successfully` 
    }, { status: 200 })

  } catch (error) {
    console.error('Error handling notification action:', error)
    return NextResponse.json({ error: 'Failed to handle notification action' }, { status: 500 })
  }
}



