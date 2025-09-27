import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'

// GET /api/readings - Get readings for a device or user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const whereClause: { deviceId?: string; device?: { userId: string } } = {}

    if (deviceId) {
      whereClause.deviceId = deviceId
    } else if (userId) {
      whereClause.device = { userId }
    }

    const readings = await prisma.reading.findMany({
      where: whereClause,
      include: {
        device: {
          select: {
            id: true,
            name: true,
            serial: true
          }
        }
      },
      orderBy: { recordedAt: 'desc' },
      take: limit,
      skip: offset
    })

    const totalCount = await prisma.reading.count({ where: whereClause })

    return NextResponse.json({
      readings,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })
  } catch (error) {
    console.error('Error fetching readings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/readings - Create a new reading (for ESP32 to send data)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deviceId, tvoc, eco2, temperature, humidity, statusMsg } = body

    if (!deviceId || tvoc === undefined || eco2 === undefined || 
        temperature === undefined || humidity === undefined) {
      return NextResponse.json({ 
        error: 'deviceId, tvoc, eco2, temperature, and humidity are required' 
      }, { status: 400 })
    }

    // Verify device exists
    const device = await prisma.device.findUnique({
      where: { id: deviceId }
    })

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    const reading = await prisma.reading.create({
      data: {
        deviceId,
        tvoc: parseFloat(tvoc),
        eco2: parseFloat(eco2),
        temperature: parseFloat(temperature),
        humidity: parseFloat(humidity),
        statusMsg: statusMsg || null
      }
    })

    return NextResponse.json(reading, { status: 201 })
  } catch (error) {
    console.error('Error creating reading:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
