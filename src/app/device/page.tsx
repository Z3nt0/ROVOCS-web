'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { ConnectDeviceModal } from '@/components/device/connect-device-modal'
import { DeviceSettingsModal } from '@/components/device/device-settings-modal'
import { DeleteDeviceModal } from '@/components/device/delete-device-modal'
import { 
  Smartphone, 
  Wifi, 
  Settings, 
  Trash2,
  CheckCircle,
  AlertCircle,
  Activity,
  Clock,
  Thermometer,
  Droplet,
  Cloud,
  Gauge,
  Zap
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

interface SensorStatus {
  name: string
  type: string
  status: 'online' | 'offline' | 'error'
  value: number | null
  unit: string
  icon: string
  color: string
}

export default function DevicePage() {
  const [device, setDevice] = useState<Device | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push('/auth/login')
    }
  }, [router])

  const fetchDevice = useCallback(async () => {
    if (!user?.id) return
    
    try {
      setIsLoading(true)
      const response = await fetch(`/api/devices?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.length > 0) {
          const deviceData = data[0] // Get the first (and only) device
          const transformedDevice = {
            id: deviceData.id,
            name: deviceData.name,
            serial: deviceData.serial,
            isConnected: deviceData.readings && deviceData.readings.length > 0 && 
              (Date.now() - new Date(deviceData.readings[0].recordedAt).getTime()) < 5 * 60 * 1000, // 5 minutes
            lastSeen: deviceData.readings && deviceData.readings.length > 0 ? 
              new Date(deviceData.readings[0].recordedAt) : null,
            readings: deviceData.readings ? deviceData.readings.length : 0,
            createdAt: deviceData.createdAt,
            avgTvoc: deviceData.readings && deviceData.readings.length > 0 ? 
              deviceData.readings.reduce((sum: number, r: { tvoc: number }) => sum + r.tvoc, 0) / deviceData.readings.length : 0,
            avgEco2: deviceData.readings && deviceData.readings.length > 0 ? 
              deviceData.readings.reduce((sum: number, r: { eco2: number }) => sum + r.eco2, 0) / deviceData.readings.length : 0,
            avgTemperature: deviceData.readings && deviceData.readings.length > 0 ? 
              deviceData.readings.reduce((sum: number, r: { temperature: number }) => sum + r.temperature, 0) / deviceData.readings.length : 0,
            avgHumidity: deviceData.readings && deviceData.readings.length > 0 ? 
              deviceData.readings.reduce((sum: number, r: { humidity: number }) => sum + r.humidity, 0) / deviceData.readings.length : 0,
          }
          setDevice(transformedDevice)
        }
      }
    } catch (error) {
      console.error('Error fetching device:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      fetchDevice()
    }
  }, [user?.id, fetchDevice])


  const handleRemoveDevice = () => {
    setIsDeleteModalOpen(true)
  }

  const handleDeviceDeleted = () => {
    setDevice(null) // Clear the device state immediately
    fetchDevice() // Refresh the device list
  }


  const handleDeviceConnected = () => {
    // Refresh device data when a new device is connected
    fetchDevice()
  }

  const handleDeviceUpdated = () => {
    // Refresh device data when settings are updated
    fetchDevice()
  }

  const getSensorStatus = (device: Device): SensorStatus[] => {
    if (!device) return []
    
    // Check if device is connected (has recent readings)
    const isDeviceConnected = device.isConnected
    
    // More accurate sensor status detection based on ESP32 code behavior
    // ESP32 sends default values (25.0°C, 50.0%, 10.0cm) when sensors fail
    // SGP30 returns -1.0 when it fails to read
    const isRealTemperature = device.avgTemperature !== undefined && device.avgTemperature !== 25.0
    const isRealHumidity = device.avgHumidity !== undefined && device.avgHumidity !== 50.0
    const isRealTvoc = device.avgTvoc !== undefined && device.avgTvoc > 0 && device.avgTvoc !== -1.0
    const isRealEco2 = device.avgEco2 !== undefined && device.avgEco2 > 0 && device.avgEco2 !== -1.0
    
    return [
      {
        name: 'SGP30 TVOC',
        type: 'Air Quality',
        status: isDeviceConnected && isRealTvoc ? 'online' : 'offline',
        value: device.avgTvoc || null,
        unit: 'ppb',
        icon: 'Cloud',
        color: 'blue'
      },
      {
        name: 'SGP30 eCO₂',
        type: 'Air Quality',
        status: isDeviceConnected && isRealEco2 ? 'online' : 'offline',
        value: device.avgEco2 || null,
        unit: 'ppm',
        icon: 'Gauge',
        color: 'green'
      },
      {
        name: 'BME280 Temperature',
        type: 'Environmental',
        status: isDeviceConnected && isRealTemperature ? 'online' : 'offline',
        value: device.avgTemperature || null,
        unit: '°C',
        icon: 'Thermometer',
        color: 'orange'
      },
      {
        name: 'BME280 Humidity',
        type: 'Environmental',
        status: isDeviceConnected && isRealHumidity ? 'online' : 'offline',
        value: device.avgHumidity || null,
        unit: '%',
        icon: 'Droplet',
        color: 'cyan'
      },
    ]
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="py-4 px-4 sm:py-6 sm:pl-2 sm:pr-6 lg:pl-2 lg:pr-8">
        <div className="max-w-7xl mx-auto w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 sm:mb-8"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                ESP32 Device Status
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Monitor your connected ESP32 sensor
              </p>
            </div>
          </motion.div>


          {/* Device and Sensor Status */}
          {device ? (
            <div className="space-y-6">
              {/* Device Status Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <Card className="hover:shadow-lg transition-shadow w-full">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 w-full">
                      <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          device.isConnected ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <Smartphone className={`w-6 h-6 sm:w-8 sm:h-8 ${
                            device.isConnected ? 'text-green-600' : 'text-red-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg sm:text-2xl truncate">{device.name}</CardTitle>
                          <CardDescription className="text-sm sm:text-lg truncate">{device.serial}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchDevice()}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Activity className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveDevice}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setIsSettingsModalOpen(true)}
                          className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Device Status</span>
                        <div className="flex items-center space-x-2">
                          {device.isConnected ? (
                            <>
                              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                              <span className="text-xs sm:text-sm text-green-600 font-medium">Online</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                              <span className="text-xs sm:text-sm text-red-600 font-medium">Offline</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Last Activity</span>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                          <span className="text-xs sm:text-sm text-gray-600">
                            {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : 'Never'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:col-span-2 lg:col-span-1">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Total Readings</span>
                        <div className="flex items-center space-x-2">
                          <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                          <span className="text-xs sm:text-sm text-gray-600">{device.readings.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Sensor Status Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0 w-full">
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Sensor Status</h2>
                    <p className="text-sm sm:text-base text-gray-600">Individual sensor readings and status</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchDevice()}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-full sm:w-auto flex-shrink-0"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {getSensorStatus(device).map((sensor, index) => {
                    const IconComponent = {
                      'Cloud': Cloud,
                      'Gauge': Gauge,
                      'Thermometer': Thermometer,
                      'Droplet': Droplet,
                      'Zap': Zap
                    }[sensor.icon] || Activity

                    return (
                      <motion.div
                        key={sensor.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                      >
                        <Card className={`hover:shadow-lg transition-shadow border-l-4 w-full ${
                          sensor.status === 'online' ? 'border-green-500' : 
                          sensor.status === 'offline' ? 'border-red-500' : 'border-gray-500'
                        }`}>
                          <CardContent className="p-3 sm:p-4 w-full">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2 sm:space-x-3">
                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
                                  sensor.status === 'online' ? 'bg-green-100' : 
                                  sensor.status === 'offline' ? 'bg-red-100' : 'bg-gray-100'
                                }`}>
                                  <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                    sensor.status === 'online' ? 'text-green-600' : 
                                    sensor.status === 'offline' ? 'text-red-600' : 'text-gray-600'
                                  }`} />
                                </div>
                                <div>
                                  <h3 className="text-sm sm:text-base font-medium text-gray-900">{sensor.name}</h3>
                                  <p className="text-xs text-gray-500">{sensor.type}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1">
                                {sensor.status === 'online' ? (
                                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                                )}
                                <span className={`text-xs font-medium ${
                                  sensor.status === 'online' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {sensor.status.toUpperCase()}
                                </span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs sm:text-sm text-gray-600">Current Value</span>
                                <span className="text-sm sm:text-lg font-semibold text-gray-900">
                                  {sensor.value !== null && sensor.value !== undefined ? `${sensor.value.toFixed(1)} ${sensor.unit}` : 'N/A'}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-xs sm:text-sm text-gray-600">Status</span>
                                <div className="flex items-center space-x-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    sensor.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                                  }`} />
                                  <span className="text-xs sm:text-sm text-gray-600">
                                    {sensor.status === 'online' ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center py-8 sm:py-12 w-full"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No device connected</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6">Connect your ESP32 sensor to start monitoring</p>
              <Button
                onClick={() => setIsConnectModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto max-w-xs mx-auto"
              >
                <Wifi className="w-4 h-4 mr-2" />
                Connect ESP32 Device
              </Button>
            </motion.div>
          )}

        </div>
      </div>

      {/* Connect Device Modal */}
      <ConnectDeviceModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onDeviceConnected={handleDeviceConnected}
        user={user}
      />

      {/* Device Settings Modal */}
      <DeviceSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        device={device}
        onDeviceUpdated={handleDeviceUpdated}
      />

      {/* Delete Device Modal */}
      <DeleteDeviceModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        device={device}
        onDeviceDeleted={handleDeviceDeleted}
      />
    </DashboardLayout>
  )
}
