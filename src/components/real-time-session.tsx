'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, Thermometer, Droplets, Wind, Wifi, WifiOff, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'

interface SessionData {
  name: string
  deviceId: string
  duration: number
}

interface Reading {
  id: string
  tvoc: number
  eco2: number
  temperature: number
  humidity: number
  statusMsg: string
  recordedAt: string
}

interface BreathAnalysisData {
  baseline?: {
    tvoc: number
    eco2: number
    sampleCount: number
    isStable: boolean
    lastUpdated: string
  }
  currentEvent?: {
    startTime: string
    endTime?: string
    peakTime?: string
    peakTvoc?: number
    peakEco2?: number
    baselineTvoc: number
    baselineEco2: number
    isComplete: boolean
  }
  metrics?: Array<{
    metricType: string
    baseline: number
    peak: number
    peakPercent: number
    timeToPeak?: number
    slope?: number
    recoveryTime?: number
    threshold?: number
  }>
}

interface RealTimeSessionProps {
  sessionData: SessionData
  onEndSession: () => void
}

export const RealTimeSession = ({ sessionData, onEndSession }: RealTimeSessionProps) => {
  const [isConnected, setIsConnected] = useState(false)
  const [readings, setReadings] = useState<Reading[]>([])
  const [currentReading, setCurrentReading] = useState<Reading | null>(null)
  const [breathAnalysis, setBreathAnalysis] = useState<BreathAnalysisData | null>(null)
  const [sessionTime, setSessionTime] = useState(0)
  const [isSessionActive, setIsSessionActive] = useState(true)
  const [isSessionComplete, setIsSessionComplete] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [error, setError] = useState('')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const createSessionReport = useCallback(async () => {
    try {
      const reportData = {
        name: `${sessionData.name} - Session Report`,
        deviceId: sessionData.deviceId,
        from: new Date(Date.now() - sessionTime * 1000).toISOString(),
        to: new Date().toISOString(),
        readings: readings
      }

      console.log('Creating session report:', reportData)

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Session report created successfully:', result)
        return result
      } else {
        const errorData = await response.json()
        console.error('Failed to create report:', errorData)
        throw new Error(errorData.error || 'Failed to create report')
      }
    } catch (error) {
      console.error('Error creating session report:', error)
      throw error
    }
  }, [sessionData.name, sessionData.deviceId, sessionTime, readings])

  const handleEndSession = useCallback(async () => {
    setIsSessionActive(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current)
    
    try {
      // Create a report from the session data
      await createSessionReport()
      console.log('Report created successfully')
    } catch (error) {
      console.error('Failed to create report:', error)
      // Continue with session end even if report creation fails
    }
    
    // Call the parent's onEndSession callback
    onEndSession()
  }, [onEndSession, createSessionReport])

  // Separate useEffect for session timer
  useEffect(() => {
    if (!isSessionActive) return

    sessionIntervalRef.current = setInterval(() => {
      setSessionTime(prev => {
        const newTime = prev + 1
        if (newTime >= sessionData.duration * 60) {
          // Don't call handleEndSession here, just return the max time
          return sessionData.duration * 60
        }
        return newTime
      })
    }, 1000)

    return () => {
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current)
      }
    }
  }, [sessionData.duration, isSessionActive])

  // Separate useEffect to handle session end when timer reaches duration
  useEffect(() => {
    if (sessionTime >= sessionData.duration * 60 && isSessionActive) {
      setIsSessionComplete(true)
      setIsSessionActive(false)
      // Clear intervals when session completes
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (sessionIntervalRef.current) clearInterval(sessionIntervalRef.current)
    }
  }, [sessionTime, sessionData.duration, isSessionActive])

  // Separate useEffect for data fetching
  useEffect(() => {
    const fetchReadings = async () => {
      try {
        const response = await fetch(`/api/readings/latest?deviceId=${sessionData.deviceId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.reading && data.isRecent) {
            setCurrentReading(data.reading)
            setReadings(prev => {
              // Avoid duplicates by checking if reading already exists
              const exists = prev.some(r => r.id === data.reading.id)
              if (!exists) {
                return [data.reading, ...prev.slice(0, 19)] // Keep last 20 readings
              }
              return prev
            })
            setIsConnected(true)
            setError('')
          } else if (data.reading && !data.isRecent) {
            setIsConnected(false)
            setError(`Device offline - last reading ${data.timeSinceReading}s ago`)
          } else {
            setIsConnected(false)
            setError('No readings available from device')
          }
        } else {
          const errorData = await response.json()
          setIsConnected(false)
          setError(errorData.error || 'Failed to fetch readings')
        }
      } catch (error) {
        console.error('Error fetching readings:', error)
        setIsConnected(false)
        setError('Device connection lost')
      }
    }

    const fetchBreathAnalysis = async () => {
      try {
        const response = await fetch(`/api/breath-analysis/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionData.deviceId, // Using deviceId as sessionId for now
            deviceId: sessionData.deviceId,
            tvoc: currentReading?.tvoc || 0,
            eco2: currentReading?.eco2 || 0,
            temperature: currentReading?.temperature || 0,
            humidity: currentReading?.humidity || 0
          })
        })
        
        if (response.ok) {
          const analysisData = await response.json()
          if (analysisData.baseline || analysisData.currentEvent || analysisData.metrics) {
            setBreathAnalysis({
              baseline: analysisData.baseline,
              currentEvent: analysisData.currentEvent,
              metrics: analysisData.metrics
            })
          }
        }
      } catch (error) {
        console.error('Error fetching breath analysis:', error)
      }
    }

    // Fetch readings every 2 seconds
    intervalRef.current = setInterval(async () => {
      await fetchReadings()
      if (currentReading) {
        await fetchBreathAnalysis()
      }
    }, 2000)
    
    fetchReadings() // Initial fetch

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [sessionData.deviceId, currentReading])



  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    if (status.includes('Good')) return 'text-green-600'
    if (status.includes('Warning')) return 'text-yellow-600'
    if (status.includes('Poor')) return 'text-red-600'
    return 'text-gray-600'
  }


  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{sessionData.name}</h2>
              <p className="text-gray-600">Real-time respiratory analysis session</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2"
            >
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Real-time Metrics */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Live Sensor Data</h3>
              
              {currentReading ? (
                <div className="grid grid-cols-2 gap-6">
                  <Card className="h-44 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Wind className="w-4 h-4 mr-2 text-blue-500" />
                        TVOC Level
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-center">
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {currentReading.tvoc.toFixed(1)}
                      </div>
                      <p className="text-xs text-gray-500">ppb (parts per billion)</p>
                    </CardContent>
                  </Card>

                  <Card className="h-44 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Activity className="w-4 h-4 mr-2 text-green-500" />
                        eCO₂ Level
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-center">
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        {currentReading.eco2.toFixed(0)}
                      </div>
                      <p className="text-xs text-gray-500">ppm (parts per million)</p>
                    </CardContent>
                  </Card>

                  <Card className="h-44 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Thermometer className="w-4 h-4 mr-2 text-orange-500" />
                        Temperature
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-center">
                      <div className="text-3xl font-bold text-orange-600 mb-1">
                        {currentReading.temperature.toFixed(1)}°C
                      </div>
                      <p className="text-xs text-gray-500">Ambient temperature</p>
                    </CardContent>
                  </Card>

                  <Card className="h-44 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Droplets className="w-4 h-4 mr-2 text-cyan-500" />
                        Humidity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-center">
                      <div className="text-3xl font-bold text-cyan-600 mb-1">
                        {currentReading.humidity.toFixed(1)}%
                      </div>
                      <p className="text-xs text-gray-500">Relative humidity</p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Waiting for sensor data...</p>
                </div>
              )}

              {/* Status */}
              {currentReading && (
                <div className="w-full">
                  <Card className="h-44 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-gray-500" />
                        Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-center">
                      <div className={`text-2xl font-bold ${getStatusColor(currentReading.statusMsg)}`}>
                        {currentReading.statusMsg}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Breath Analysis Metrics */}
              {breathAnalysis && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Breath Analysis</h3>
                  
                  {/* Baseline Status */}
                  {breathAnalysis.baseline && (
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center">
                          <Activity className="w-4 h-4 mr-2 text-blue-500" />
                          Baseline Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <div className="text-sm text-gray-500 mb-1">TVOC Baseline</div>
                            <div className="text-xl font-bold text-blue-600 mb-1">
                              {breathAnalysis.baseline.tvoc.toFixed(1)} ppb
                            </div>
                            <div className="text-xs text-gray-500">
                              {breathAnalysis.baseline.isStable ? 'Stable' : 'Calibrating...'}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 mb-1">eCO₂ Baseline</div>
                            <div className="text-xl font-bold text-green-600 mb-1">
                              {breathAnalysis.baseline.eco2.toFixed(0)} ppm
                            </div>
                            <div className="text-xs text-gray-500">
                              Samples: {breathAnalysis.baseline.sampleCount}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Current Breath Event */}
                  {breathAnalysis.currentEvent && (
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center">
                          <Wind className="w-4 h-4 mr-2 text-purple-500" />
                          Breath Event
                          {breathAnalysis.currentEvent.isComplete ? (
                            <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
                          ) : (
                            <div className="w-4 h-4 ml-2 bg-yellow-500 rounded-full animate-pulse" />
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Peak TVOC</div>
                            <div className="text-xl font-bold text-purple-600">
                              {breathAnalysis.currentEvent.peakTvoc?.toFixed(1) || 'N/A'} ppb
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-500 mb-1">Peak eCO₂</div>
                            <div className="text-xl font-bold text-purple-600">
                              {breathAnalysis.currentEvent.peakEco2?.toFixed(0) || 'N/A'} ppm
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500">
                          Status: {breathAnalysis.currentEvent.isComplete ? 'Complete' : 'In Progress'}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Analysis Metrics */}
                  {breathAnalysis.metrics && breathAnalysis.metrics.length > 0 && (
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center">
                          <Thermometer className="w-4 h-4 mr-2 text-orange-500" />
                          Analysis Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {breathAnalysis.metrics.map((metric, index) => (
                            <div key={index} className="border rounded-lg p-4 bg-gray-50">
                              <div className="text-sm font-medium text-gray-700 mb-3">
                                {metric.metricType.toUpperCase()} Analysis
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <span className="text-gray-500">Peak %:</span>
                                  <span className="ml-1 font-semibold text-blue-600">
                                    {metric.peakPercent.toFixed(1)}%
                                  </span>
                                </div>
                                {metric.timeToPeak && (
                                  <div>
                                    <span className="text-gray-500">Time to Peak:</span>
                                    <span className="ml-1 font-semibold text-green-600">
                                      {metric.timeToPeak.toFixed(1)}s
                                    </span>
                                  </div>
                                )}
                                {metric.slope && (
                                  <div>
                                    <span className="text-gray-500">Slope:</span>
                                    <span className="ml-1 font-semibold text-purple-600">
                                      {metric.slope.toFixed(2)} ppb/s
                                    </span>
                                  </div>
                                )}
                                {metric.recoveryTime && (
                                  <div>
                                    <span className="text-gray-500">Recovery:</span>
                                    <span className="ml-1 font-semibold text-orange-600">
                                      {metric.recoveryTime.toFixed(1)}s
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

            </div>

            {/* Session Controls & History */}
            <div className="space-y-6">
              <Card className="h-72 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Session Controls</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {formatTime(sessionTime)}
                    </div>
                    <div className="text-sm text-gray-500">
                      of {sessionData.duration} minutes
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleEndSession}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3"
                    disabled={!isSessionActive}
                  >
                    End Session
                  </Button>
                </CardContent>
              </Card>

              <Card className="h-72 flex flex-col shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>Recent Readings</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 font-normal">
                        {readings.length} total
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Force refresh readings
                          setReadings([])
                        }}
                        className="h-6 w-6 p-0 hover:bg-gray-100"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {readings.length > 0 ? (
                      readings.slice(0, 1).map((reading, index) => (
                        <motion.div
                          key={`${reading.id}-${index}-${reading.recordedAt}`}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex justify-between items-center p-4 rounded-lg border bg-green-50 border-green-200 shadow-sm"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 text-sm mb-2">
                              <div className="flex items-center space-x-1">
                                <Wind className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-green-700">
                                  {reading.tvoc.toFixed(1)} ppb
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Activity className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-blue-700">
                                  {reading.eco2.toFixed(0)} ppm
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-gray-500">
                                {new Date(reading.recordedAt).toLocaleTimeString()}
                              </div>
                              <div className="text-xs text-green-600 font-medium">
                                Latest Reading
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm text-gray-500">Waiting for readings...</p>
                      </div>
                    )}
                  </div>

                  {readings.length > 2 && (
                    <div className="mt-4 text-center">
                      <div className="text-xs text-gray-500">
                        Latest 2 readings of {readings.length} total
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </motion.div>

      {/* Session Complete Modal */}
      {isSessionComplete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center"
          >
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Session Complete!</h3>
              <p className="text-gray-600">
                Your {sessionData.duration}-minute breathing analysis session has finished successfully.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Session Duration</div>
                  <div className="font-semibold">{formatTime(sessionTime)}</div>
                </div>
                <div>
                  <div className="text-gray-500">Total Readings</div>
                  <div className="font-semibold">{readings.length}</div>
                </div>
                <div>
                  <div className="text-gray-500">Device Status</div>
                  <div className={`font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Final Reading</div>
                  <div className="font-semibold">
                    {currentReading ? `${currentReading.tvoc.toFixed(1)} ppb` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={async () => {
                  setIsGeneratingReport(true)
                  try {
                    await handleEndSession()
                  } catch (error) {
                    console.error('Error ending session:', error)
                    setIsGeneratingReport(false)
                  }
                }}
                disabled={isGeneratingReport}
                className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
              >
                {isGeneratingReport ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Generate Report & Close
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500">
                A detailed report will be generated with your session data
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
