'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  X, 
  Save, 
  Smartphone, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Settings
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

interface DeviceSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  device: Device | null
  onDeviceUpdated?: () => void
}

export function DeviceSettingsModal({ isOpen, onClose, device, onDeviceUpdated }: DeviceSettingsModalProps) {
  const [deviceName, setDeviceName] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')

  useEffect(() => {
    if (device && isOpen) {
      setDeviceName(device.name)
    }
  }, [device, isOpen])

  const handleSave = async () => {
    if (!device) return

    setSaveStatus('saving')

    try {
      const response = await fetch(`/api/devices/${device.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: deviceName
        }),
      })

      if (response.ok) {
        setSaveStatus('success')
        onDeviceUpdated?.()
        
        // Auto-close after success
        setTimeout(() => {
          onClose()
          setSaveStatus('idle')
        }, 1500)
      } else {
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    } catch (error) {
      console.error('Error updating device settings:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      // Loading state is handled by saveStatus
    }
  }

  const handleClose = () => {
    if (saveStatus !== 'saving') {
      setSaveStatus('idle')
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
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Device Settings</CardTitle>
                  <CardDescription className="text-sm">
                    Configure your ESP32 device
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                disabled={saveStatus === 'saving'}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
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
                <div className="flex items-center space-x-1">
                  {device.isConnected ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-xs font-medium ${
                    device.isConnected ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {device.isConnected ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            {/* Settings Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="device-name" className="text-sm font-medium">
                  Device Name
                </Label>
                <Input
                  id="device-name"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="Enter device name"
                  className="w-full"
                />
              </div>

            </div>

            {/* Status Messages */}
            {saveStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">Settings saved successfully!</span>
              </motion.div>
            )}

            {saveStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">Failed to save settings. Please try again.</span>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={saveStatus === 'saving'}
                className="px-4"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveStatus === 'saving' || !deviceName.trim()}
                className="px-4 bg-blue-600 hover:bg-blue-700"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
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
