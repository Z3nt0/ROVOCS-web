'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { 
  Download, 
  Calendar, 
  Activity, 
  Thermometer, 
  Droplets,
  Wind,
  BarChart3,
  FileText
} from 'lucide-react'

interface ReportData {
  id: string
  name: string
  deviceId: string
  from: string
  to: string
  createdAt: string
  fileUrl: string
  readingsCount: number
  device?: {
    name: string
    serial: string
  }
  readings?: Array<{
    id: string
    tvoc: number
    eco2: number
    temperature: number
    humidity: number
    recordedAt: string
  }>
}

interface ReportViewerModalProps {
  isOpen: boolean
  onClose: () => void
  reportId: string
}

export const ReportViewerModal = ({ isOpen, onClose, reportId }: ReportViewerModalProps) => {
  const [report, setReport] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchReportDetails = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const response = await fetch(`/api/reports/${reportId}`)
      if (response.ok) {
        const data = await response.json()
        setReport(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch report details')
      }
    } catch (error) {
      console.error('Error fetching report details:', error)
      setError('Failed to fetch report details')
    } finally {
      setIsLoading(false)
    }
  }, [reportId])

  useEffect(() => {
    if (isOpen && reportId) {
      fetchReportDetails()
    }
  }, [isOpen, reportId, fetchReportDetails])

  const handleDownload = () => {
    if (report?.fileUrl) {
      // Create a temporary link to download the file
      const link = document.createElement('a')
      link.href = report.fileUrl
      link.download = `${report.name || 'Report'}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const calculateStats = (readings: Array<{ tvoc: number; eco2: number; temperature: number; humidity: number }>) => {
    if (!readings || readings.length === 0) {
      return {
        avgTVOC: 0,
        avgECO2: 0,
        avgTemperature: 0,
        avgHumidity: 0,
        maxTVOC: 0,
        minTVOC: 0,
        maxECO2: 0,
        minECO2: 0
      }
    }

    const tvocValues = readings.map(r => r.tvoc).filter(v => v > 0)
    const eco2Values = readings.map(r => r.eco2).filter(v => v > 0)
    const tempValues = readings.map(r => r.temperature).filter(v => v > 0)
    const humidityValues = readings.map(r => r.humidity).filter(v => v > 0)

    return {
      avgTVOC: tvocValues.length > 0 ? tvocValues.reduce((a, b) => a + b, 0) / tvocValues.length : 0,
      avgECO2: eco2Values.length > 0 ? eco2Values.reduce((a, b) => a + b, 0) / eco2Values.length : 0,
      avgTemperature: tempValues.length > 0 ? tempValues.reduce((a, b) => a + b, 0) / tempValues.length : 0,
      avgHumidity: humidityValues.length > 0 ? humidityValues.reduce((a, b) => a + b, 0) / humidityValues.length : 0,
      maxTVOC: tvocValues.length > 0 ? Math.max(...tvocValues) : 0,
      minTVOC: tvocValues.length > 0 ? Math.min(...tvocValues) : 0,
      maxECO2: eco2Values.length > 0 ? Math.max(...eco2Values) : 0,
      minECO2: eco2Values.length > 0 ? Math.min(...eco2Values) : 0
    }
  }

  const formatDuration = (from: string, to: string) => {
    const start = new Date(from)
    const end = new Date(to)
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const remainingMins = diffMins % 60
    
    if (diffHours > 0) {
      return `${diffHours}h ${remainingMins}m`
    }
    return `${diffMins}m`
  }

  if (!isOpen) return null

  const stats = report?.readings ? calculateStats(report.readings) : null

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title={report?.name || 'Report Details'}
      size="xl"
    >
      <div className="max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-gray-600">
              {report?.device?.name || 'Device'} • {report?.readingsCount || 0} readings
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleDownload}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full"
            />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <FileText className="w-12 h-12 mx-auto mb-2" />
              <p className="text-lg font-medium">Error Loading Report</p>
              <p className="text-sm">{error}</p>
            </div>
            <Button onClick={fetchReportDetails} variant="outline">
              Try Again
            </Button>
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* Session Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Session Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Start Time</p>
                    <p className="font-medium">{new Date(report.from).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Time</p>
                    <p className="font-medium">{new Date(report.to).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium">{formatDuration(report.from, report.to)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Summary */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Avg TVOC</p>
                        <p className="text-2xl font-bold text-green-600">
                          {stats.avgTVOC.toFixed(1)} ppb
                        </p>
                        <p className="text-xs text-gray-500">
                          Range: {stats.minTVOC.toFixed(1)} - {stats.maxTVOC.toFixed(1)}
                        </p>
                      </div>
                      <Wind className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Avg eCO₂</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {stats.avgECO2.toFixed(1)} ppm
                        </p>
                        <p className="text-xs text-gray-500">
                          Range: {stats.minECO2.toFixed(1)} - {stats.maxECO2.toFixed(1)}
                        </p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Avg Temperature</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {stats.avgTemperature.toFixed(1)}°C
                        </p>
                      </div>
                      <Thermometer className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Avg Humidity</p>
                        <p className="text-2xl font-bold text-cyan-600">
                          {stats.avgHumidity.toFixed(1)}%
                        </p>
                      </div>
                      <Droplets className="w-8 h-8 text-cyan-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Recent Readings */}
            {report.readings && report.readings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Recent Readings
                  </CardTitle>
                  <CardDescription>
                    Latest sensor data from the session
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {report.readings.slice(0, 10).map((reading, index) => (
                      <motion.div
                        key={reading.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="text-sm text-gray-500">
                            {new Date(reading.recordedAt).toLocaleTimeString()}
                          </div>
                          <div className="flex items-center space-x-6 text-sm">
                            <div>
                              <span className="text-gray-500">TVOC:</span>
                              <span className="ml-1 font-medium text-green-600">
                                {reading.tvoc.toFixed(1)} ppb
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">eCO₂:</span>
                              <span className="ml-1 font-medium text-blue-600">
                                {reading.eco2.toFixed(1)} ppm
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Temp:</span>
                              <span className="ml-1 font-medium text-orange-600">
                                {reading.temperature.toFixed(1)}°C
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Humidity:</span>
                              <span className="ml-1 font-medium text-cyan-600">
                                {reading.humidity.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {(!report.readings || report.readings.length === 0) && (
              <Card>
                <CardContent className="text-center py-12">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No readings available
                  </h3>
                  <p className="text-gray-600">
                    This report doesn&apos;t contain detailed sensor readings
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
