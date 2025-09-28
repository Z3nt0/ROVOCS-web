'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  X, 
  Trash2, 
  AlertTriangle,
  Smartphone
} from 'lucide-react'

interface Device {
  id: string
  name: string
  serial: string
  isConnected: boolean
  lastSeen: Date | null
  readings: number
  createdAt: string
  avgTvoc?: number
  avgEco2?: number
  avgTemperature?: number
  avgHumidity?: number
}

interface DeleteDeviceModalProps {
  isOpen: boolean
  onClose: () => void
  device: Device | null
  onDeviceDeleted?: () => void
}

export function DeleteDeviceModal({ isOpen, onClose, device, onDeviceDeleted }: DeleteDeviceModalProps) {
  const [deleteStatus, setDeleteStatus] = useState<'idle' | 'deleting' | 'success' | 'error'>('idle')

  const handleDelete = async () => {
    if (!device) return

    setDeleteStatus('deleting')

    try {
      const response = await fetch(`/api/devices/${device.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDeleteStatus('success')
        onDeviceDeleted?.()
        
        // Auto-close after success
        setTimeout(() => {
          onClose()
          setDeleteStatus('idle')
        }, 1500)
      } else {
        const error = await response.json()
        console.error('Failed to delete device:', error)
        setDeleteStatus('error')
        setTimeout(() => setDeleteStatus('idle'), 3000)
      }
    } catch (error) {
      console.error('Error deleting device:', error)
      setDeleteStatus('error')
      setTimeout(() => setDeleteStatus('idle'), 3000)
    } finally {
      setDeleteStatus('idle')
    }
  }

  const handleClose = () => {
    if (deleteStatus !== 'deleting') {
      setDeleteStatus('idle')
      onClose()
    }
  }

  if (!device) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md"
          >
            <Card className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-red-700">Delete Device</CardTitle>
                      <CardDescription className="text-sm">
                        This action cannot be undone
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    disabled={deleteStatus === 'deleting'}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Warning Message */}
                <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-red-800 mb-1">Warning: This will permanently delete your device</p>
                    <p className="text-red-700">
                      All sensor readings will be deleted, but your reports will be preserved for historical reference.
                    </p>
                  </div>
                </div>

                {/* Device Info */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      device.isConnected ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <Smartphone className={`w-4 h-4 ${
                        device.isConnected ? 'text-green-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{device.name}</p>
                      <p className="text-xs text-gray-500">{device.serial}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Readings</p>
                      <p className="text-sm font-medium text-gray-900">{device.readings.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Status Messages */}
                {deleteStatus === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <AlertTriangle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">Device deleted successfully!</span>
                  </motion.div>
                )}

                {deleteStatus === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-red-700">Failed to delete device. Please try again.</span>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={deleteStatus === 'deleting'}
                    className="px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDelete}
                    disabled={deleteStatus === 'deleting'}
                    className="px-4 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deleteStatus === 'deleting' ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                        />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Device
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
