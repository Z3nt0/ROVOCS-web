import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../lib/prisma'

// GET /api/devices - Get all devices for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const devices = await prisma.device.findMany({
      where: { userId },
      include: {
        readings: {
          orderBy: { recordedAt: 'desc' },
          take: 1
        }
      }
    })

    return NextResponse.json(devices)
  } catch (error) {
    console.error('Error fetching devices:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/devices - Create a new device
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, serial, userId } = body

    if (!name || !serial || !userId) {
      return NextResponse.json({ error: 'Name, serial, and userId are required' }, { status: 400 })
    }

    // Check if device with this serial already exists
    const existingDevice = await prisma.device.findUnique({
      where: { serial }
    })

    if (existingDevice) {
      return NextResponse.json({ error: 'Device with this serial number already exists' }, { status: 409 })
    }

    const device = await prisma.device.create({
      data: {
        name,
        serial,
        userId
      }
    })

    return NextResponse.json(device, { status: 201 })
  } catch (error) {
    console.error('Error creating device:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
