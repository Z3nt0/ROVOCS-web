import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'

// GET /api/reports/[id] - Get a specific report with detailed analytics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const report = await prisma.report.findUnique({
      where: { id },
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

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Get readings for this report's time period
    const readings = await prisma.reading.findMany({
      where: {
        deviceId: report.deviceId,
        recordedAt: {
          gte: report.from,
          lte: report.to
        }
      },
      orderBy: { recordedAt: 'desc' },
      take: 100 // Limit to last 100 readings for performance
    })

    // Calculate analytics
    const analytics = {
      totalReadings: readings.length,
      avgTVOC: readings.length > 0 ? readings.reduce((sum, r) => sum + r.tvoc, 0) / readings.length : 0,
      avgECO2: readings.length > 0 ? readings.reduce((sum, r) => sum + r.eco2, 0) / readings.length : 0,
      avgTemperature: readings.length > 0 ? readings.reduce((sum, r) => sum + r.temperature, 0) / readings.length : 0,
      avgHumidity: readings.length > 0 ? readings.reduce((sum, r) => sum + r.humidity, 0) / readings.length : 0,
      maxTVOC: readings.length > 0 ? Math.max(...readings.map(r => r.tvoc)) : 0,
      minTVOC: readings.length > 0 ? Math.min(...readings.map(r => r.tvoc)) : 0,
      maxECO2: readings.length > 0 ? Math.max(...readings.map(r => r.eco2)) : 0,
      minECO2: readings.length > 0 ? Math.min(...readings.map(r => r.eco2)) : 0
    }

    return NextResponse.json({
      ...report,
      readings,
      analytics
    })
  } catch (error) {
    console.error('Error fetching report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/reports/[id] - Delete a report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.report.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Report deleted successfully' })
  } catch (error) {
    console.error('Error deleting report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
