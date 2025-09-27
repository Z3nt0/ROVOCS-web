'use client'

import { useState, useEffect, useCallback } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { motion } from 'framer-motion'
import { Activity, Smartphone, Wifi, WifiOff, AlertCircle } from 'lucide-react'

interface StartSessionModalProps {
  isOpen: boolean
  onClose: () => void
  onStartSession: (sessionData: { name: string; deviceId: string; duration: number }) => void
}

interface Device {
  id: string
  name: string
  serial: string
  isConnected: boolean
}

export const StartSessionModal = ({ isOpen, onClose, onStartSession }: StartSessionModalProps) => {
  const [sessionName, setSessionName] = useState('')
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [sessionDuration, setSessionDuration] = useState(5) // Default 5 minutes
  const [devices, setDevices] = useState<Device[]>([])
  const [isLoadingDevices, setIsLoadingDevices] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<{ id: string } | null>(null)

  const fetchDevices = useCallback(async () => {
    setIsLoadingDevices(true)
    setError('')
    try {
      const response = await fetch(`/api/devices?userId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        const transformedDevices = data.map((device: { id: string; name: string; serial: string; readings: { recordedAt: string }[] }) => ({
          id: device.id,
          name: device.name,
          serial: device.serial,
          isConnected: device.readings && device.readings.length > 0 && 
            (Date.now() - new Date(device.readings[0].recordedAt).getTime()) < 5 * 60 * 1000 // 5 minutes
        }))
        setDevices(transformedDevices)
        if (transformedDevices.length > 0) {
          setSelectedDeviceId(transformedDevices[0].id)
        }
      } else {
        setError('Failed to fetch devices.')
      }
    } catch (err) {
      console.error('Error fetching devices:', err)
      setError('Network error or server is unreachable.')
    } finally {
      setIsLoadingDevices(false)
    }
  }, [user?.id])

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchDevices()
    }
  }, [isOpen, user, fetchDevices])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sessionName || !selectedDeviceId || sessionDuration <= 0) {
      setError('Please fill all required fields and select a device.')
      return
    }
    onStartSession({ name: sessionName, deviceId: selectedDeviceId, duration: sessionDuration })
    onClose()
    setSessionName('')
    setSessionDuration(5)
    setError('')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start New Breathing Session"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div>
          <Label htmlFor="sessionName" className="text-sm font-medium text-gray-700">
            Session Name
          </Label>
          <Input
            id="sessionName"
            type="text"
            placeholder="e.g., Morning Breath Analysis"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            className="mt-1 block w-full border-gray-200 focus:border-green-500 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <Label htmlFor="device" className="text-sm font-medium text-gray-700">
            Select Device
          </Label>
          {isLoadingDevices ? (
            <div className="mt-1 flex items-center space-x-2 text-gray-500">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full"
              />
              <span>Loading devices...</span>
            </div>
          ) : devices.length === 0 ? (
            <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-sm text-yellow-700">No devices found. Please add a device first.</p>
            </div>
          ) : (
            <Select onValueChange={setSelectedDeviceId} value={selectedDeviceId}>
              <SelectTrigger className="mt-1 block w-full h-11 border-gray-200 focus:border-green-500 focus:ring-green-500">
                <SelectValue placeholder="Select a device" />
              </SelectTrigger>
              <SelectContent>
                {devices.map((device) => (
                  <SelectItem key={device.id} value={device.id}>
                    <div className="flex items-center">
                      <Smartphone className="w-4 h-4 mr-2 text-gray-500" />
                      <span>{device.name} ({device.serial})</span>
                      {device.isConnected ? (
                        <Wifi className="w-4 h-4 ml-2 text-green-500" />
                      ) : (
                        <WifiOff className="w-4 h-4 ml-2 text-red-500" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div>
          <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
            Session Duration (minutes)
          </Label>
          <Input
            id="duration"
            type="number"
            min="1"
            value={sessionDuration}
            onChange={(e) => setSessionDuration(Number(e.target.value))}
            className="mt-1 block w-full border-gray-200 focus:border-green-500 focus:ring-green-500"
            required
          />
        </div>

        <div className="space-y-4 p-4 bg-green-50 rounded-md border border-green-200">
          <h4 className="text-lg font-semibold text-green-800 flex items-center">
            <Activity className="w-5 h-5 mr-2" /> Session Instructions
          </h4>
          <ul className="list-disc list-inside text-sm text-green-700 space-y-2">
            <li>Ensure your selected ESP32 device is powered on and connected to Wi-Fi.</li>
            <li>Maintain a consistent breathing position for accurate readings.</li>
            <li>Avoid talking or moving excessively during the session.</li>
            <li>Results will be displayed on your dashboard and saved as a report.</li>
          </ul>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
            Start Session
          </Button>
        </div>
      </form>
    </Modal>
  )
}