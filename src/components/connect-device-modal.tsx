'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Modal } from '@/components/ui/modal'
import { 
  Smartphone, 
  Wifi, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  QrCode
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
}

interface ConnectDeviceModalProps {
  isOpen: boolean
  onClose: () => void
  onDeviceConnected: () => void
  user: User | null
}

export function ConnectDeviceModal({ isOpen, onClose, onDeviceConnected, user }: ConnectDeviceModalProps) {
  const [deviceSerial, setDeviceSerial] = useState('')
  const [deviceName, setDeviceName] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'waiting' | 'verifying' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')
  const [pairingCode, setPairingCode] = useState('')
  const [verificationAttempts, setVerificationAttempts] = useState(0)
  const [maxAttempts] = useState(30) // 30 attempts = 60 seconds
  const [verificationInterval, setVerificationInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isOpen) {
      // Generate a unique pairing code when modal opens
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      setPairingCode(code)
      // Reset form state
      setDeviceSerial('')
      setDeviceName('')
      setError('')
      setConnectionStatus('idle')
      setVerificationAttempts(0)
    }
  }, [isOpen])

  const handleConnectDevice = async () => {
    if (!deviceSerial || !deviceName) {
      setError('Please enter both device name and serial number')
      return
    }

    setIsConnecting(true)
    setConnectionStatus('connecting')
    setError('')

    try {
      const response = await fetch('/api/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: deviceName,
          serial: deviceSerial,
          userId: user?.id,
          pairingCode: pairingCode,
        }),
      })

      if (response.ok) {
        setConnectionStatus('waiting')
        startVerificationProcess()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to connect device')
        setConnectionStatus('error')
      }
    } catch (error) {
      console.error('Connection error:', error)
      setError('Network error. Please check your connection.')
      setConnectionStatus('error')
    } finally {
      setIsConnecting(false)
    }
  }

  const startVerificationProcess = () => {
    setVerificationAttempts(0)
    setConnectionStatus('verifying')
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/devices/verify?serial=${deviceSerial}&code=${pairingCode}`)
        const data = await response.json()
        
        if (data.verified) {
          clearInterval(interval)
          setConnectionStatus('success')
          setTimeout(() => {
            onDeviceConnected()
            onClose()
          }, 2000)
        } else {
          setVerificationAttempts(prev => {
            const newAttempts = prev + 1
            if (newAttempts >= maxAttempts) {
              clearInterval(interval)
              setConnectionStatus('error')
              setError('Device verification timeout. Please check your ESP32 and try again.')
            }
            return newAttempts
          })
        }
      } catch (error) {
        console.error('Verification error:', error)
        setVerificationAttempts(prev => {
          const newAttempts = prev + 1
          if (newAttempts >= maxAttempts) {
            clearInterval(interval)
            setConnectionStatus('error')
            setError('Device verification failed. Please check your ESP32 connection.')
          }
          return newAttempts
        })
      }
    }, 2000) // Check every 2 seconds
    
    setVerificationInterval(interval)
  }

  const cancelVerification = () => {
    if (verificationInterval) {
      clearInterval(verificationInterval)
      setVerificationInterval(null)
    }
    setConnectionStatus('idle')
    setVerificationAttempts(0)
    setError('')
  }

  const copyPairingCode = () => {
    navigator.clipboard.writeText(pairingCode)
  }

  const handleClose = () => {
    // Clean up any running verification
    if (verificationInterval) {
      clearInterval(verificationInterval)
      setVerificationInterval(null)
    }
    onClose()
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      title="Connect ESP32 Device"
      size="xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 min-h-0 lg:items-stretch">
          {/* Connection Steps */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="h-full"
          >
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Smartphone className="w-5 h-5 mr-2 text-green-600" />
                  Device Setup Steps
                </CardTitle>
                <CardDescription>
                  Follow these steps to connect your ESP32 device
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 flex-1">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs sm:text-sm font-medium text-green-600">1</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base">Upload Firmware</h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Upload the ROVOCS firmware to your ESP32 device
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs sm:text-sm font-medium text-green-600">2</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base">Configure Wi-Fi</h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Set up Wi-Fi credentials in the device configuration
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs sm:text-sm font-medium text-green-600">3</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base">Enter Pairing Code</h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Use the pairing code below to authenticate the device
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs sm:text-sm font-medium text-green-600">4</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base">Test Connection</h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Verify the device is sending data to your account
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Device Registration Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="h-full"
          >
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>Device Information</CardTitle>
                <CardDescription>
                  Enter your device details to complete the pairing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 flex-1">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-600">{error}</p>
                  </motion.div>
                )}

                <div className="w-full">
                  <Label htmlFor="deviceName" className="text-sm font-medium text-gray-700">
                    Device Name
                  </Label>
                  <Input
                    id="deviceName"
                    type="text"
                    placeholder="e.g., ROVOCS-001"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    className="mt-1 w-full border-gray-200 focus:border-green-500 focus:ring-green-500 text-sm sm:text-base"
                  />
                </div>

                <div className="w-full">
                  <Label htmlFor="deviceSerial" className="text-sm font-medium text-gray-700">
                    Device Serial Number
                  </Label>
                  <Input
                    id="deviceSerial"
                    type="text"
                    placeholder="e.g., ESP32-001"
                    value={deviceSerial}
                    onChange={(e) => setDeviceSerial(e.target.value)}
                    className="mt-1 w-full border-gray-200 focus:border-green-500 focus:ring-green-500 text-sm sm:text-base"
                  />
                </div>

                {/* Pairing Code Display */}
                <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-md w-full">
                  <div className="flex flex-col gap-3">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-green-800">Pairing Code</h4>
                      <p className="text-xs sm:text-sm text-green-700">Enter this code in your ESP32 device</p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-base sm:text-lg font-mono font-bold text-green-800 bg-green-100 px-2 sm:px-3 py-1 rounded flex-1 text-center">
                        {pairingCode}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyPairingCode}
                        className="text-green-600 border-green-300 hover:bg-green-50 flex-shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {(!deviceName || !deviceSerial) && (
                  <div className="text-xs text-amber-600 mb-2 text-center">
                    Please fill in both device name and serial number to continue
                  </div>
                )}
                
                <Button
                  onClick={handleConnectDevice}
                  disabled={isConnecting || !deviceName || !deviceSerial}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base py-2 sm:py-2.5 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  style={{ minHeight: '44px' }}
                >
                  {connectionStatus === 'connecting' ? (
                    <div className="flex items-center space-x-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Connecting...</span>
                    </div>
                  ) : connectionStatus === 'waiting' ? (
                    <div className="flex items-center space-x-2">
                      <Wifi className="w-4 h-4" />
                      <span>Waiting for Device...</span>
                    </div>
                  ) : connectionStatus === 'verifying' ? (
                    <div className="flex items-center space-x-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Verifying... ({verificationAttempts}/{maxAttempts})</span>
                    </div>
                  ) : connectionStatus === 'success' ? (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Device Connected!</span>
                    </div>
                  ) : (
                    'Connect Device'
                  )}
                </Button>

                {connectionStatus === 'verifying' && (
                  <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg w-full">
                    <div className="flex items-center space-x-2 mb-2">
                      <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      <span className="text-xs sm:text-sm font-medium text-blue-800">Verifying Device Connection</span>
                    </div>
                    <p className="text-xs sm:text-sm text-blue-700 mb-3">
                      Make sure your ESP32 is powered on and has the correct pairing code: <strong>{pairingCode}</strong>
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="text-xs text-blue-600">
                        Attempts: {verificationAttempts}/{maxAttempts}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelVerification}
                        className="text-blue-600 border-blue-300 hover:bg-blue-100 w-full sm:w-auto text-xs sm:text-sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ESP32 Configuration Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-4 sm:mt-6 lg:mt-8"
        >
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center text-sm sm:text-base">
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                ESP32 Configuration
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Configure your ESP32 device with these settings
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                <div className="w-full">
                  <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Wi-Fi Settings</h4>
                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                    <p><strong>SSID:</strong> Your Wi-Fi network name</p>
                    <p><strong>Password:</strong> Your Wi-Fi password</p>
                    <p><strong>Server URL:</strong> <code className="bg-gray-100 px-1 rounded text-xs">http://your-domain.com</code></p>
                  </div>
                </div>
                <div className="w-full">
                  <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Device Settings</h4>
                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                    <p><strong>Pairing Code:</strong> <code className="bg-green-100 px-1 rounded text-xs">{pairingCode}</code></p>
                    <p><strong>Update Interval:</strong> 2 seconds</p>
                    <p><strong>Sensor Calibration:</strong> Auto</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
    </Modal>
  )
}
