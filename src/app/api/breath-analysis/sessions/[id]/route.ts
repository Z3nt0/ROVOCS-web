import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/database/prisma'

// GET /api/breath-analysis/sessions/[id] - Get detailed breath session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await prisma.breathSession.findUnique({
      where: { id },
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
          include: {
            breathMetrics: {
              orderBy: { calculatedAt: 'desc' }
            }
          }
        },
        breathMetrics: {
          orderBy: { calculatedAt: 'desc' }
        }
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Calculate session analytics
    const analytics = {
      totalEvents: session.breathEvents.length,
      completedEvents: session.breathEvents.filter(e => e.isComplete).length,
      avgTvocBaseline: session.baselineTvoc,
      avgEco2Baseline: session.baselineEco2,
      avgPeakTvoc: session.breathEvents.length > 0 
        ? session.breathEvents.reduce((sum, e) => sum + (e.peakTvoc || 0), 0) / session.breathEvents.length 
        : 0,
      avgPeakEco2: session.breathEvents.length > 0 
        ? session.breathEvents.reduce((sum, e) => sum + (e.peakEco2 || 0), 0) / session.breathEvents.length 
        : 0,
      avgRecoveryTime: session.breathMetrics.length > 0 
        ? session.breathMetrics.reduce((sum, m) => sum + (m.recoveryTime || 0), 0) / session.breathMetrics.length 
        : 0
    }

    return NextResponse.json({
      ...session,
      analytics
    })
  } catch (error) {
    console.error('Error fetching breath session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/breath-analysis/sessions/[id] - Update breath session
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, isActive, endTime } = body

    const updateData: {
      name?: string
      isActive?: boolean
      endTime?: Date
    } = {}
    if (name !== undefined) updateData.name = name
    if (isActive !== undefined) updateData.isActive = isActive
    if (endTime !== undefined) updateData.endTime = new Date(endTime)

    const session = await prisma.breathSession.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error updating breath session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/breath-analysis/sessions/[id] - Delete breath session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Delete related breath events and metrics first
    await prisma.breathMetrics.deleteMany({
      where: { sessionId: id }
    })

    await prisma.breathEvent.deleteMany({
      where: { sessionId: id }
    })

    // Delete the session
    await prisma.breathSession.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Session deleted successfully' })
  } catch (error) {
    console.error('Error deleting breath session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
