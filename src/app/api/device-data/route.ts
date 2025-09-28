import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/database/prisma'

// POST /api/device-data - Receive sensor data from ESP32
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      deviceSerial, 
      pairingCode, 
      tvoc, 
      eco2, 
      temperature, 
      humidity, 
      statusMsg 
    } = body

    // Validate required fields
    if (!deviceSerial || !pairingCode || tvoc === undefined || eco2 === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find device by serial and verify pairing code
    const device = await prisma.device.findUnique({
      where: { serial: deviceSerial },
      include: { user: true }
    })

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found. Please register the device first.' },
        { status: 404 }
      )
    }

    // In a real implementation, you would verify the pairing code
    // For now, we'll accept any pairing code for registered devices
    if (device.userId === null) {
      return NextResponse.json(
        { error: 'Device not paired with any user account' },
        { status: 400 }
      )
    }

    // Create new reading
    const reading = await prisma.reading.create({
      data: {
        deviceId: device.id,
        tvoc: parseFloat(tvoc),
        eco2: parseFloat(eco2),
        temperature: parseFloat(temperature || 0),
        humidity: parseFloat(humidity || 0),
        statusMsg: statusMsg || 'Data received'
      }
    })

    // Update device last seen timestamp (you could add a lastSeen field to Device model)
    await prisma.device.update({
      where: { id: device.id },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({
      success: true,
      message: 'Data received successfully',
      readingId: reading.id,
      timestamp: reading.recordedAt
    })

  } catch (error) {
    console.error('Error processing device data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/device-data - Get device status (for ESP32 to check connection)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceSerial = searchParams.get('serial')
    const pairingCode = searchParams.get('code')

    if (!deviceSerial || !pairingCode) {
      return NextResponse.json(
        { error: 'Missing device serial or pairing code' },
        { status: 400 }
      )
    }

    const device = await prisma.device.findUnique({
      where: { serial: deviceSerial },
      include: { user: true }
    })

    if (!device) {
      return NextResponse.json(
        { error: 'Device not found' },
        { status: 404 }
      )
    }

    if (device.userId === null) {
      return NextResponse.json(
        { error: 'Device not paired' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      status: 'connected',
      deviceId: device.id,
      deviceName: device.name,
      userId: device.userId,
      lastUpdate: device.updatedAt
    })

  } catch (error) {
    console.error('Error checking device status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


