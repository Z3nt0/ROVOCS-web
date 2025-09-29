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
import { generateReportPDFFromElement } from '@/lib/analysis/pdf-generator'

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
  analytics?: {
    totalReadings: number
    avgTVOC: number
    avgECO2: number
    avgTemperature: number
    avgHumidity: number
    maxTVOC: number
    minTVOC: number
    maxECO2: number
    minECO2: number
  }
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
  const [isDownloading, setIsDownloading] = useState(false)

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

  const handleDownload = async () => {
    if (isDownloading) return
    
    try {
      setIsDownloading(true)
      console.log('Starting PDF generation...')
      
      // Check if the element exists
      const element = document.getElementById('report-modal-content')
      if (!element) {
        throw new Error('Report content element not found')
      }
      
      console.log('Element found, proceeding with PDF generation...')
      
      // Generate PDF from the modal content
      await generateReportPDFFromElement('report-modal-content', report?.name || 'Report')
      
      console.log('PDF generated successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      
      // Try alternative PDF generation method
      try {
        console.log('Trying alternative PDF generation...')
        
        // Create a simple text-based report as fallback
        const reportText = `
ROVOCS Respiratory Health Report
${report?.name || 'Report'}

Session Information:
- Device: ${report?.device?.name || 'Device Removed'}
- Start Time: ${report?.from ? new Date(report.from).toLocaleString() : 'N/A'}
- End Time: ${report?.to ? new Date(report.to).toLocaleString() : 'N/A'}
- Duration: ${report?.from && report?.to ? formatDuration(report.from, report.to) : 'N/A'}
- Total Readings: ${report?.readingsCount || 0}

Summary Statistics:
- Average TVOC: ${report?.analytics?.avgTVOC?.toFixed(1) || 'N/A'} ppb
- Average eCO₂: ${report?.analytics?.avgECO2?.toFixed(1) || 'N/A'} ppm
- Average Temperature: ${report?.analytics?.avgTemperature?.toFixed(1) || 'N/A'}°C
- Average Humidity: ${report?.analytics?.avgHumidity?.toFixed(1) || 'N/A'}%

Generated on: ${new Date().toLocaleString()}
        `.trim()
        
        // Create and download text file as fallback
        const blob = new Blob([reportText], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `ROVOCS_Report_${(report?.name || 'Report').replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        console.log('Fallback text report generated')
        alert('PDF generation failed, but a text report has been downloaded instead.')
      } catch (fallbackError) {
        console.error('Fallback PDF generation also failed:', fallbackError)
        alert('Failed to generate report. Please try again or contact support if the issue persists.')
      }
    } finally {
      setIsDownloading(false)
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

  const getBreathQualityAssessment = (analytics: {
    avgPeakPercent?: number
    avgRecoveryTime?: number
    totalEvents?: number
    completedEvents?: number
  } | null) => {
    if (!analytics) return null

    const avgPeakPercent = analytics.avgPeakPercent || 0
    const avgRecoveryTime = analytics.avgRecoveryTime || 0
    const totalEvents = analytics.totalEvents || 0
    const completedEvents = analytics.completedEvents || 0

    let quality = 'excellent'
    const recommendations: string[] = []

    if (avgPeakPercent < 10) {
      quality = 'poor'
      recommendations.push('Low VOC concentration detected. Try deeper breathing.')
    } else if (avgPeakPercent < 25) {
      quality = 'fair'
      recommendations.push('Moderate VOC concentration. Consider longer exhalation.')
    } else {
      // Combined good and excellent categories (avgPeakPercent >= 25%)
      quality = 'excellent'
    }

    if (avgRecoveryTime > 30) {
      quality = 'poor'
      recommendations.push('Slow recovery time may indicate respiratory issues.')
    } else if (avgRecoveryTime > 20) {
      quality = 'fair'
      recommendations.push('Recovery time is moderate. Consider breathing exercises.')
    }

    if (completedEvents < totalEvents * 0.8) {
      recommendations.push('Some breath events were incomplete. Ensure proper exhalation technique.')
    }

    return { quality, recommendations }
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
      <div 
        id="report-modal-content"
        className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar touch-pan-y"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db #f3f4f6'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
          <div>
            <p className="text-sm sm:text-base text-gray-600">
              {report?.device?.name || 'Device Removed'} • {report?.readingsCount || 0} readings
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                  />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </>
              )}
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
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Session Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Start Time</p>
                    <p className="text-sm sm:text-base font-medium">{new Date(report.from).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">End Time</p>
                    <p className="text-sm sm:text-base font-medium">{new Date(report.to).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Duration</p>
                    <p className="text-sm sm:text-base font-medium">{formatDuration(report.from, report.to)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Summary */}
            {stats && (
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-gray-500">Avg TVOC</p>
                        <p className="text-lg sm:text-2xl font-bold text-green-600">
                          {stats.avgTVOC.toFixed(1)} ppb
                        </p>
                        <p className="text-xs text-gray-500 hidden sm:block">
                          Range: {stats.minTVOC.toFixed(1)} - {stats.maxTVOC.toFixed(1)}
                        </p>
                      </div>
                      <Wind className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-gray-500">Avg eCO₂</p>
                        <p className="text-lg sm:text-2xl font-bold text-blue-600">
                          {stats.avgECO2.toFixed(1)} ppm
                        </p>
                        <p className="text-xs text-gray-500 hidden sm:block">
                          Range: {stats.minECO2.toFixed(1)} - {stats.maxECO2.toFixed(1)}
                        </p>
                      </div>
                      <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-gray-500">Avg Temperature</p>
                        <p className="text-lg sm:text-2xl font-bold text-orange-600">
                          {stats.avgTemperature.toFixed(1)}°C
                        </p>
                      </div>
                      <Thermometer className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-gray-500">Avg Humidity</p>
                        <p className="text-lg sm:text-2xl font-bold text-cyan-600">
                          {stats.avgHumidity.toFixed(1)}%
                        </p>
                      </div>
                      <Droplets className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-600 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Breath Analysis Section */}
            {report.analytics && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base sm:text-lg">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Breath Analysis Summary
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Advanced respiratory health metrics from breath analysis algorithms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                      <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Baseline TVOC</div>
                      <div className="text-lg sm:text-2xl font-bold text-blue-700">
                        {report.analytics.avgTVOC.toFixed(1)} ppb
                      </div>
                      <div className="text-xs text-blue-500">Ambient baseline</div>
                    </div>
                    
                    <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                      <div className="text-xs sm:text-sm text-green-600 font-medium mb-1">Baseline eCO₂</div>
                      <div className="text-lg sm:text-2xl font-bold text-green-700">
                        {report.analytics.avgECO2.toFixed(1)} ppm
                      </div>
                      <div className="text-xs text-green-500">Ambient baseline</div>
                    </div>
                    
                    <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
                      <div className="text-xs sm:text-sm text-purple-600 font-medium mb-1">Peak TVOC</div>
                      <div className="text-lg sm:text-2xl font-bold text-purple-700">
                        {report.analytics.maxTVOC.toFixed(1)} ppb
                      </div>
                      <div className="text-xs text-purple-500">Maximum detected</div>
                    </div>
                    
                    <div className="bg-orange-50 p-3 sm:p-4 rounded-lg">
                      <div className="text-xs sm:text-sm text-orange-600 font-medium mb-1">Peak eCO₂</div>
                      <div className="text-lg sm:text-2xl font-bold text-orange-700">
                        {report.analytics.maxECO2.toFixed(1)} ppm
                      </div>
                      <div className="text-xs text-orange-500">Maximum detected</div>
                    </div>
                    
                    <div className="bg-cyan-50 p-3 sm:p-4 rounded-lg">
                      <div className="text-xs sm:text-sm text-cyan-600 font-medium mb-1">Peak % Increase</div>
                      <div className="text-lg sm:text-2xl font-bold text-cyan-700">
                        {(((report.analytics.maxTVOC - report.analytics.avgTVOC) / report.analytics.avgTVOC) * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-cyan-500">Over baseline</div>
                    </div>
                    
                    <div className="bg-pink-50 p-3 sm:p-4 rounded-lg">
                      <div className="text-xs sm:text-sm text-pink-600 font-medium mb-1">Total Readings</div>
                      <div className="text-lg sm:text-2xl font-bold text-pink-700">
                        {report.analytics.totalReadings}
                      </div>
                      <div className="text-xs text-pink-500">Data points</div>
                    </div>
                  </div>
                  
                  {/* Breath Quality Assessment */}
                  {(() => {
                    const assessment = getBreathQualityAssessment({
                      avgPeakPercent: ((report.analytics.maxTVOC - report.analytics.avgTVOC) / report.analytics.avgTVOC) * 100,
                      avgRecoveryTime: 0, // This would come from actual breath analysis data
                      totalEvents: 1,
                      completedEvents: 1
                    })
                    if (!assessment) return null
                    
                    const qualityColors = {
                      excellent: 'text-green-600 bg-green-50',
                      fair: 'text-yellow-600 bg-yellow-50',
                      poor: 'text-red-600 bg-red-50'
                    }
                    
                    return (
                      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                          <h4 className="text-base sm:text-lg font-semibold text-gray-900">Breath Quality Assessment</h4>
                          <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium w-fit ${qualityColors[assessment.quality as keyof typeof qualityColors]}`}>
                            {assessment.quality.charAt(0).toUpperCase() + assessment.quality.slice(1)}
                          </span>
                        </div>
                        
                        {assessment.recommendations.length > 0 && (
                          <div>
                            <h5 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Recommendations:</h5>
                            <ul className="space-y-1">
                              {assessment.recommendations.map((rec, index) => (
                                <li key={index} className="text-xs sm:text-sm text-gray-600 flex items-start">
                                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-1.5 sm:mt-2 mr-2 flex-shrink-0" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Recent Readings */}
            {report.readings && report.readings.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base sm:text-lg">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Recent Readings
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Latest sensor data from the session
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                    {report.readings.slice(0, 10).map((reading, index) => (
                      <motion.div
                        key={reading.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-2 sm:p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                          <div className="text-xs sm:text-sm text-gray-500 flex-shrink-0">
                            {new Date(reading.recordedAt).toLocaleTimeString()}
                          </div>
                          <div className="grid grid-cols-2 sm:flex sm:items-center sm:space-x-6 text-xs sm:text-sm gap-2">
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
                <CardContent className="text-center py-8 sm:py-12">
                  <Activity className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    No readings available
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
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
