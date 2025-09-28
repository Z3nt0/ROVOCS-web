'use client'

import { useState, useEffect, useCallback } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { motion } from 'framer-motion'
import { Calendar, Smartphone, Bell, AlertCircle, Wifi, WifiOff } from 'lucide-react'

interface ScheduleTestModalProps {
  isOpen: boolean
  onClose: () => void
  onScheduleTest: (scheduleData: { 
    name: string
    deviceId: string
    date: string
    time: string
    duration: number
    frequency: string
    reminders: boolean
  }) => void
}

interface Device {
  id: string
  name: string
  serial: string
  isConnected: boolean
}

export const ScheduleTestModal = ({ isOpen, onClose, onScheduleTest }: ScheduleTestModalProps) => {
  const [testName, setTestName] = useState('')
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [testDate, setTestDate] = useState('')
  const [testTime, setTestTime] = useState('')
  const [testDuration, setTestDuration] = useState(10)
  const [testFrequency, setTestFrequency] = useState('once')
  const [remindersEnabled, setRemindersEnabled] = useState(true)
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
      // Set default date to today
      const today = new Date()
      setTestDate(today.toISOString().split('T')[0])
      setTestTime(today.toTimeString().split(' ')[0].substring(0, 5))
    }
  }, [isOpen, user, fetchDevices])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!testName || !selectedDeviceId || !testDate || !testTime || testDuration <= 0) {
      setError('Please fill all required fields.')
      return
    }
    onScheduleTest({
      name: testName,
      deviceId: selectedDeviceId,
      date: testDate,
      time: testTime,
      duration: testDuration,
      frequency: testFrequency,
      reminders: remindersEnabled
    })
    onClose()
    setTestName('')
    setTestDuration(10)
    setTestFrequency('once')
    setRemindersEnabled(true)
    setError('')
  }

  const formatDateTime = (date: string, time: string) => {
    if (!date || !time) return 'N/A'
    try {
      const dt = new Date(`${date}T${time}`)
      return dt.toLocaleString()
    } catch {
      return 'Invalid Date/Time'
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule New Test"
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
          <Label htmlFor="testName" className="text-sm font-medium text-gray-700">
            Test Name
          </Label>
          <Input
            id="testName"
            type="text"
            placeholder="e.g., Weekly Lung Function Check"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="testDate" className="text-sm font-medium text-gray-700">
              Date
            </Label>
            <Input
              id="testDate"
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              className="mt-1 block w-full border-gray-200 focus:border-green-500 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <Label htmlFor="testTime" className="text-sm font-medium text-gray-700">
              Time
            </Label>
            <Input
              id="testTime"
              type="time"
              value={testTime}
              onChange={(e) => setTestTime(e.target.value)}
              className="mt-1 block w-full border-gray-200 focus:border-green-500 focus:ring-green-500"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
            Test Duration (minutes)
          </Label>
          <Input
            id="duration"
            type="number"
            min="1"
            value={testDuration}
            onChange={(e) => setTestDuration(Number(e.target.value))}
            className="mt-1 block w-full border-gray-200 focus:border-green-500 focus:ring-green-500"
            required
          />
        </div>

        <div>
          <Label htmlFor="frequency" className="text-sm font-medium text-gray-700">
            Frequency
          </Label>
          <Select onValueChange={setTestFrequency} value={testFrequency}>
            <SelectTrigger className="mt-1 block w-full h-11 border-gray-200 focus:border-green-500 focus:ring-green-500">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="once">Once</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Input
            id="reminders"
            type="checkbox"
            checked={remindersEnabled}
            onChange={(e) => setRemindersEnabled(e.target.checked)}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <Label htmlFor="reminders" className="text-sm font-medium text-gray-700">
            Enable Reminders
          </Label>
          <Bell className="w-4 h-4 text-gray-500" />
        </div>

        <div className="space-y-3 p-4 bg-green-50 rounded-md border border-green-200">
          <h4 className="text-lg font-semibold text-green-800 flex items-center">
            <Calendar className="w-5 h-5 mr-2" /> Schedule Preview
          </h4>
          <p className="text-sm text-green-700">
            <span className="font-medium">Test:</span> {testName || 'N/A'}
          </p>
          <p className="text-sm text-green-700">
            <span className="font-medium">Device:</span> {devices.find(d => d.id === selectedDeviceId)?.name || 'N/A'}
          </p>
          <p className="text-sm text-green-700">
            <span className="font-medium">Date & Time:</span> {formatDateTime(testDate, testTime)}
          </p>
          <p className="text-sm text-green-700">
            <span className="font-medium">Duration:</span> {testDuration} minutes
          </p>
          <p className="text-sm text-green-700">
            <span className="font-medium">Frequency:</span> {testFrequency.charAt(0).toUpperCase() + testFrequency.slice(1)}
          </p>
          <p className="text-sm text-green-700">
            <span className="font-medium">Reminders:</span> {remindersEnabled ? 'Enabled' : 'Disabled'}
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
            Schedule Test
          </Button>
        </div>
      </form>
    </Modal>
  )
}