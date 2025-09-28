import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/database/prisma'

// GET /api/devices/[id] - Get a specific device
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const device = await prisma.device.findUnique({
      where: { id },
      include: {
        readings: {
          orderBy: { recordedAt: 'desc' },
          take: 10
        }
      }
    })

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }

    return NextResponse.json(device)
  } catch (error) {
    console.error('Error fetching device:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/devices/[id] - Update a device
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const device = await prisma.device.update({
      where: { id },
      data: { name }
    })

    return NextResponse.json(device)
  } catch (error) {
    console.error('Error updating device:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/devices/[id] - Partially update a device
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name } = body

    // Build update data object with only provided fields
    const updateData: { name?: string } = {}
    if (name !== undefined) updateData.name = name

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const device = await prisma.device.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(device)
  } catch (error) {
    console.error('Error updating device:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/devices/[id] - Delete a device
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if device exists first
    const device = await prisma.device.findUnique({
      where: { id }
    })
    
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }
    
    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // Delete all related readings
      await tx.reading.deleteMany({
        where: { deviceId: id }
      })
      
      // Update reports to remove device reference instead of deleting them
      await tx.report.updateMany({
        where: { deviceId: id },
        data: { deviceId: null }
      })
      
      // Update breath sessions to remove device reference
      await tx.breathSession.updateMany({
        where: { deviceId: id },
        data: { deviceId: null }
      })
      
      // Finally, delete the device
      await tx.device.delete({
        where: { id }
      })
    })

    return NextResponse.json({ message: 'Device deleted successfully' })
  } catch (error: unknown) {
    console.error('Error deleting device:', error)
    
    // Provide more specific error messages
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to delete device. Please try again.',
      details: process.env.NODE_ENV === 'development' && error && typeof error === 'object' && 'message' in error ? String(error.message) : undefined
    }, { status: 500 })
  }
}
