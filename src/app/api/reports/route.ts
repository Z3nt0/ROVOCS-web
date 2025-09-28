import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/database/prisma'

// GET /api/reports - Get reports for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const reports = await prisma.report.findMany({
      where: { userId },
      include: {
        device: {
          select: {
            id: true,
            name: true,
            serial: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    const totalCount = await prisma.report.count({ where: { userId } })

    return NextResponse.json({
      reports,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/reports - Create a new report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, deviceId, from, to, readings, userId } = body

    if (!deviceId || !from || !to) {
      return NextResponse.json({ 
        error: 'deviceId, from, and to are required' 
      }, { status: 400 })
    }

    // Get device to find userId if not provided
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
      select: { userId: true }
    })

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    const reportUserId = userId || device.userId
    if (!reportUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Create a simple file URL for the report (in a real app, this would be a generated PDF)
    const fileUrl = `/reports/${Date.now()}-${deviceId}.json`

    const report = await prisma.report.create({
      data: {
        userId: reportUserId,
        deviceId,
        from: new Date(from),
        to: new Date(to),
        fileUrl
      }
    })

    return NextResponse.json({
      ...report,
      name: name || `Session Report - ${new Date().toLocaleDateString()}`,
      readingsCount: readings ? readings.length : 0
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
