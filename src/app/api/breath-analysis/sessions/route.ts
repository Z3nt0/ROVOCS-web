import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'

// POST /api/breath-analysis/sessions - Create a new breath analysis session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, deviceId, name } = body

    if (!userId || !deviceId || !name) {
      return NextResponse.json(
        { error: 'userId, deviceId, and name are required' },
        { status: 400 }
      )
    }

    // Verify user and device exist
    const user = await prisma.user.findUnique({ where: { id: userId } })
    const device = await prisma.device.findUnique({ where: { id: deviceId } })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    // Create new breath session
    const session = await prisma.breathSession.create({
      data: {
        userId,
        deviceId,
        name,
        startTime: new Date(),
        isActive: true
      },
      include: {
        device: {
          select: {
            id: true,
            name: true,
            serial: true
          }
        }
      }
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('Error creating breath session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/breath-analysis/sessions - Get breath sessions for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const sessions = await prisma.breathSession.findMany({
      where: { userId },
      include: {
        device: {
          select: {
            id: true,
            name: true,
            serial: true
          }
        },
        breathEvents: {
          orderBy: { startTime: 'desc' },
          take: 5
        },
        breathMetrics: {
          orderBy: { calculatedAt: 'desc' },
          take: 10
        }
      },
      orderBy: { startTime: 'desc' },
      take: limit,
      skip: offset
    })

    const totalCount = await prisma.breathSession.count({
      where: { userId }
    })

    return NextResponse.json({
      sessions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })
  } catch (error) {
    console.error('Error fetching breath sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
