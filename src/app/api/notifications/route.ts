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

// In-memory storage for notification read states
const notificationReadStates = new Map<string, Set<string>>()

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

    // Get user's read notification IDs
    const userReadNotifications = notificationReadStates.get(userId) || new Set()

    // Create notification items
    const notifications: NotificationItem[] = []

    // Add reading notifications
    recentReadings.forEach(reading => {
      const notificationId = `reading-${reading.id}`
      notifications.push({
        id: notificationId,
        type: 'reading',
        title: 'New reading recorded',
        message: `TVOC: ${reading.tvoc.toFixed(1)} ppb, eCO₂: ${reading.eco2.toFixed(0)} ppm from ${reading.device.name}`,
        timestamp: reading.recordedAt,
        isRead: userReadNotifications.has(notificationId),
        icon: 'Activity',
        color: 'blue'
      })
    })

    // Add report notifications
    recentReports.forEach(report => {
      const notificationId = `report-${report.id}`
      notifications.push({
        id: notificationId,
        type: 'report',
        title: 'Report generated',
        message: `New report created for analysis`,
        timestamp: report.createdAt,
        isRead: userReadNotifications.has(notificationId),
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
          const notificationId = `device-${device.id}`
          notifications.push({
            id: notificationId,
            type: 'device',
            title: `${device.name} connected`,
            message: `Device ${device.serial} is online and sending data`,
            timestamp: lastReading.recordedAt,
            isRead: userReadNotifications.has(notificationId),
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
    const { userId, notificationIds, action } = body

    if (!userId || !action) {
      return NextResponse.json({ error: 'User ID and action are required' }, { status: 400 })
    }

    // Get or create user's read notifications set
    if (!notificationReadStates.has(userId)) {
      notificationReadStates.set(userId, new Set())
    }
    const userReadNotifications = notificationReadStates.get(userId)!

    if (action === 'markAsRead') {
      if (notificationIds && Array.isArray(notificationIds)) {
        // Mark specific notifications as read
        notificationIds.forEach((id: string) => {
          userReadNotifications.add(id)
        })
      } else {
        // Mark all notifications as read
        // This will be handled by the frontend when "Mark all as read" is clicked
        return NextResponse.json({ 
          success: true, 
          message: 'All notifications marked as read' 
        }, { status: 200 })
      }
    } else if (action === 'markAllAsRead') {
      // Mark all notifications as read by fetching current notifications and marking them
      const response = await fetch(`${request.url.split('/api')[0]}/api/notifications?userId=${userId}&limit=100`)
      if (response.ok) {
        const data = await response.json()
        data.notifications.forEach((notification: NotificationItem) => {
          userReadNotifications.add(notification.id)
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Notifications ${action} successfully` 
    }, { status: 200 })

  } catch (error) {
    console.error('Error handling notification action:', error)
    return NextResponse.json({ error: 'Failed to handle notification action' }, { status: 500 })
  }
}



