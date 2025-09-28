import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/database/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get start of today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get readings count for today
    const todayReadings = await prisma.reading.count({
      where: {
        device: {
          userId: userId
        },
        recordedAt: {
          gte: today
        }
      }
    })

    // Get readings count for last 24 hours
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const last24HoursReadings = await prisma.reading.count({
      where: {
        device: {
          userId: userId
        },
        recordedAt: {
          gte: last24Hours
        }
      }
    })

    // Get readings count for yesterday for comparison
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayReadings = await prisma.reading.count({
      where: {
        device: {
          userId: userId
        },
        recordedAt: {
          gte: yesterday,
          lt: today
        }
      }
    })

    return NextResponse.json({
      today: todayReadings,
      last24Hours: last24HoursReadings,
      yesterday: yesterdayReadings,
      change: yesterdayReadings > 0 ? 
        ((todayReadings - yesterdayReadings) / yesterdayReadings * 100).toFixed(1) : 0
    }, { status: 200 })

  } catch (error) {
    console.error('Error fetching today\'s readings:', error)
    return NextResponse.json({ error: 'Failed to fetch today\'s readings' }, { status: 500 })
  }
}






