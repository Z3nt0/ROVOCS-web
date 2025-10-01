'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { ReportViewerModal } from '@/components/reports/report-viewer-modal'
import { AnalyticsChart } from '@/components/dashboard/analytics-chart'
import { StartSessionModal } from '@/components/device/start-session-modal'
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  BarChart3,
  Activity,
  Clock,
  Filter,
  Eye
} from 'lucide-react'
import { generateReportPDF, ReportData } from '@/lib/analysis/pdf-generator'

interface Report {
  id: string
  title: string
  date: Date
  duration: string
  readings: number
  status: 'completed' | 'processing' | 'failed'
  fileUrl?: string
  device?: { name: string; serial: string } | null
  summary: {
    avgTVOC: number
    avgECO2: number
    avgTemperature: number
    avgHumidity: number
  }
  breathAnalysis?: {
    totalEvents: number
    completedEvents: number
    avgBaselineTvoc: number
    avgBaselineEco2: number
    avgPeakTvoc: number
    avgPeakEco2: number
    avgRecoveryTime: number
    avgPeakPercent: number
    avgTimeToPeak: number
    avgSlope: number
  }
}

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null)
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null)
  const [isStartSessionModalOpen, setIsStartSessionModalOpen] = useState(false)
  const router = useRouter()

  // Helper function to safely calculate averages
  const calculateAverage = (reports: Report[], getValue: (report: Report) => number): number => {
    if (reports.length === 0) return 0
    return Math.round(reports.reduce((sum, report) => sum + getValue(report), 0) / reports.length)
  }

  // Authentication check
  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true)
    } else if (status === 'unauthenticated') {
      router.replace('/auth/login')
    } else if (status === 'authenticated') {
      setIsLoading(false)
      // Set user from session
      if (session?.user) {
        setUser({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          id: (session.user as any).id || '',
          name: session.user.name || '',
          email: session.user.email || ''
        })
      }
    }
  }, [status, session, router])

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/reports?userId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        
        // Fetch detailed data for each report
        const detailedReports = await Promise.all(
          data.reports.map(async (report: { 
            id: string; 
            from: string; 
            createdAt: string; 
            to: string; 
            device?: { name: string; serial: string } | null;
          }) => {
            try {
              // Fetch detailed report data with readings and analytics
              const detailResponse = await fetch(`/api/reports/${report.id}`)
              if (detailResponse.ok) {
                const detailData = await detailResponse.json()
                
                // Calculate duration
                const fromDate = new Date(report.from)
                const toDate = new Date(report.to)
                const durationMs = toDate.getTime() - fromDate.getTime()
                const durationMins = Math.floor(durationMs / 60000)
                const durationHours = Math.floor(durationMins / 60)
                const remainingMins = durationMins % 60
                const duration = durationHours > 0 ? `${durationHours}h ${remainingMins}m` : `${durationMins}m`
                
                return {
                  id: report.id,
                  title: `Session Report - ${fromDate.toLocaleDateString()}${report.device ? ` (${report.device.name})` : ' (Device Removed)'}`,
                  date: new Date(report.createdAt),
                  duration: duration,
                  readings: detailData.readings?.length || 0,
                  status: 'completed',
                  fileUrl: detailData.fileUrl,
                  summary: {
                    avgTVOC: detailData.analytics?.avgTVOC || 0,
                    avgECO2: detailData.analytics?.avgECO2 || 0,
                    avgTemperature: detailData.analytics?.avgTemperature || 0,
                    avgHumidity: detailData.analytics?.avgHumidity || 0
                  },
                  device: report.device,
                  breathAnalysis: detailData.analytics ? {
                    totalEvents: 0,
                    completedEvents: 0,
                    avgBaselineTvoc: detailData.analytics.avgTVOC,
                    avgBaselineEco2: detailData.analytics.avgECO2,
                    avgPeakTvoc: detailData.analytics.maxTVOC,
                    avgPeakEco2: detailData.analytics.maxECO2,
                    avgRecoveryTime: 0,
                    avgPeakPercent: detailData.analytics.maxTVOC > 0 ? ((detailData.analytics.maxTVOC - detailData.analytics.avgTVOC) / detailData.analytics.avgTVOC) * 100 : 0,
                    avgTimeToPeak: 0,
                    avgSlope: 0
                  } : undefined
                }
              } else {
                // Fallback to basic data if detailed fetch fails
                return {
                  id: report.id,
                  title: `Session Report - ${new Date(report.from).toLocaleDateString()}${report.device ? ` (${report.device.name})` : ' (Device Removed)'}`,
                  date: new Date(report.createdAt),
                  duration: 'N/A',
                  readings: 0,
                  status: 'completed',
                  fileUrl: undefined,
                  summary: {
                    avgTVOC: 0,
                    avgECO2: 0,
                    avgTemperature: 0,
                    avgHumidity: 0
                  },
                  device: report.device
                }
              }
            } catch (error) {
              console.error(`Error fetching details for report ${report.id}:`, error)
              // Return basic data on error
              return {
                id: report.id,
                title: `Session Report - ${new Date(report.from).toLocaleDateString()}${report.device ? ` (${report.device.name})` : ' (Device Removed)'}`,
                date: new Date(report.createdAt),
                duration: 'N/A',
                readings: 0,
                status: 'completed',
                fileUrl: undefined,
                summary: {
                  avgTVOC: 0,
                  avgECO2: 0,
                  avgTemperature: 0,
                  avgHumidity: 0
                },
                device: report.device
              }
            }
          })
        )
        
        setReports(detailedReports)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      fetchReports()
    }
  }, [user, fetchReports])

  const handleDownload = async (report: Report) => {
    setDownloadingReportId(report.id)
    try {
      // Convert Report interface to ReportData interface for PDF generation
      const reportData: ReportData = {
        id: report.id,
        title: report.title,
        date: report.date,
        duration: report.duration,
        readingCount: report.readings,
        status: report.status,
        summary: report.summary,
        breathAnalysis: report.breathAnalysis,
        device: undefined // Will be populated if available
      }

      await generateReportPDF(reportData)
    } catch (error) {
      console.error('Error generating PDF:', error)
      
      // Try fallback to original download if PDF generation fails
      if (report.fileUrl) {
        try {
          const link = document.createElement('a')
          link.href = report.fileUrl
          link.download = `${report.title}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        } catch (fallbackError) {
          console.error('Fallback download also failed:', fallbackError)
          alert('Failed to download report. Please try again or contact support if the issue persists.')
        }
      } else {
        alert('No report file available for download. Please try again or contact support if the issue persists.')
      }
    } finally {
      setDownloadingReportId(null)
    }
  }


  const handleViewReport = (report: Report) => {
    setSelectedReport(report)
    setIsViewerOpen(true)
  }

  const handleCloseViewer = () => {
    setIsViewerOpen(false)
    setSelectedReport(null)
  }


  const handleStartSession = () => {
    setIsStartSessionModalOpen(true)
  }

  const handleSessionStart = (sessionData: { name: string; deviceId: string; duration: number }) => {
    console.log('Starting session:', sessionData)
    // Close the modal
    setIsStartSessionModalOpen(false)
    // Optionally refresh reports after starting a session
    if (user?.id) {
      fetchReports()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'processing':
        return 'text-yellow-600 bg-yellow-100'
      case 'failed':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Reports & Analytics
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  View and download your respiratory health analysis reports
                </p>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Button variant="outline" className="flex items-center justify-center w-full sm:w-auto">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                  <Download className="w-4 h-4 mr-2" />
                  Export All
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <Card>
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Total Reports</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">{reports.length}</p>
                    </div>
                    <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Card>
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Total Readings</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">
                        {reports.reduce((sum, report) => sum + report.readings, 0).toLocaleString()}
                      </p>
                    </div>
                    <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <Card>
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Avg TVOC</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">
                        {calculateAverage(reports, report => report.summary.avgTVOC)}
                      </p>
                    </div>
                    <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Card>
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">Avg eCO₂</p>
                      <p className="text-lg sm:text-2xl font-bold text-gray-900">
                        {calculateAverage(reports, report => report.summary.avgECO2)}
                      </p>
                    </div>
                    <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Analytics Charts */}
          {reports.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <AnalyticsChart
                  title="Air Quality Distribution"
                  data={[
                    {
                      label: 'TVOC (ppb)',
                      value: calculateAverage(reports, report => report.summary.avgTVOC),
                      color: '#10b981',
                      trend: 'up'
                    },
                    {
                      label: 'eCO₂ (ppm)',
                      value: calculateAverage(reports, report => report.summary.avgECO2),
                      color: '#3b82f6',
                      trend: 'stable'
                    },
                    {
                      label: 'Temperature (°C)',
                      value: calculateAverage(reports, report => report.summary.avgTemperature),
                      color: '#f59e0b',
                      trend: 'stable'
                    },
                    {
                      label: 'Humidity (%)',
                      value: calculateAverage(reports, report => report.summary.avgHumidity),
                      color: '#06b6d4',
                      trend: 'down'
                    }
                  ]}
                  type="bar"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <AnalyticsChart
                  title="Report Status"
                  data={[
                    {
                      label: 'Completed',
                      value: reports.filter(r => r.status === 'completed').length,
                      color: '#10b981'
                    },
                    {
                      label: 'Processing',
                      value: reports.filter(r => r.status === 'processing').length,
                      color: '#f59e0b'
                    },
                    {
                      label: 'Failed',
                      value: reports.filter(r => r.status === 'failed').length,
                      color: '#ef4444'
                    }
                  ]}
                  type="donut"
                />
              </motion.div>
            </div>
          )}

          {/* Reports List */}
          <div className="space-y-3 sm:space-y-4">
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3 sm:mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            {report.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium w-fit ${getStatusColor(report.status)}`}>
                            {report.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-0">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span>{report.date.toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span>{report.duration}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Activity className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span>{report.readings} readings</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span>Session Complete</span>
                          </div>
                        </div>

                        <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                          <div>
                            <span className="text-gray-500">TVOC:</span>
                            <span className="ml-1 sm:ml-2 font-medium">{report.summary.avgTVOC.toFixed(1)} ppb</span>
                          </div>
                          <div>
                            <span className="text-gray-500">eCO₂:</span>
                            <span className="ml-1 sm:ml-2 font-medium">{report.summary.avgECO2.toFixed(1)} ppm</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Temp:</span>
                            <span className="ml-1 sm:ml-2 font-medium">{report.summary.avgTemperature.toFixed(1)}°C</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Humidity:</span>
                            <span className="ml-1 sm:ml-2 font-medium">{report.summary.avgHumidity.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 sm:ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReport(report)}
                          className="w-full sm:w-auto"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        {report.status === 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => handleDownload(report)}
                            disabled={downloadingReportId === report.id}
                            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto disabled:opacity-50"
                          >
                            {downloadingReportId === report.id ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                                />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Empty State */}
          {reports.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center py-8 sm:py-12"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                No reports available
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6">
                Start a breathing session to generate your first report
              </p>
              <Button 
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                onClick={handleStartSession}
              >
                Start New Session
              </Button>
            </motion.div>
          )}
        </div>

        {/* Report Viewer Modal */}
        {selectedReport && (
          <ReportViewerModal
            isOpen={isViewerOpen}
            onClose={handleCloseViewer}
            reportId={selectedReport.id}
          />
        )}

        {/* Start Session Modal */}
        <StartSessionModal
          isOpen={isStartSessionModalOpen}
          onClose={() => setIsStartSessionModalOpen(false)}
          onStartSession={handleSessionStart}
        />
      </div>
    </DashboardLayout>
  )
}
