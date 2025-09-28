import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/database/prisma'

// GET /api/devices/verify - Verify device pairing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serial = searchParams.get('serial')
    const code = searchParams.get('code')

    if (!serial || !code) {
      return NextResponse.json({ error: 'Serial and code are required' }, { status: 400 })
    }

    // Find the device by serial
    const device = await prisma.device.findUnique({
      where: { serial },
      include: {
        readings: {
          orderBy: { recordedAt: 'desc' },
          take: 1
        }
      }
    })

    if (!device) {
      return NextResponse.json({ verified: false, message: 'Device not found' }, { status: 200 })
    }

    // Check if device has sent data recently (within last 2 minutes)
    const now = new Date()
    const hasRecentData = device.readings.length > 0 && 
      (now.getTime() - new Date(device.readings[0].recordedAt).getTime()) < 2 * 60 * 1000

    if (hasRecentData) {
      // Device is verified - it has sent data recently
      return NextResponse.json({ 
        verified: true, 
        message: 'Device verified successfully',
        device: {
          id: device.id,
          name: device.name,
          serial: device.serial,
          lastSeen: device.readings[0].recordedAt
        }
      }, { status: 200 })
    } else {
      // Device not verified yet - no recent data
      return NextResponse.json({ 
        verified: false, 
        message: 'Waiting for device to send data...',
        device: {
          id: device.id,
          name: device.name,
          serial: device.serial
        }
      }, { status: 200 })
    }

  } catch (error) {
    console.error('Error verifying device:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}






