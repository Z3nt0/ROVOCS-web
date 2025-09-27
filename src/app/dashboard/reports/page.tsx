'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { Navbar } from '@/components/navbar'
import { ReportViewerModal } from '@/components/report-viewer-modal'
import { AnalyticsChart } from '@/components/analytics-chart'
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

interface Report {
  id: string
  title: string
  date: Date
  duration: string
  readings: number
  status: 'completed' | 'processing' | 'failed'
  fileUrl?: string
  summary: {
    avgTVOC: number
    avgECO2: number
    avgTemperature: number
    avgHumidity: number
  }
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push('/auth/login')
    }
  }, [router])

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/reports?userId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        // Transform API data to match our interface
        const transformedReports = data.reports.map((report: { id: string; from: string; createdAt: string; to: string; readings: Array<{ tvoc: number; eco2: number; temperature: number; humidity: number }> }) => ({
          id: report.id,
          title: `Session Report - ${new Date(report.from).toLocaleDateString()}`,
          date: new Date(report.createdAt),
          duration: 'N/A', // Calculate from from/to dates if needed
          readings: 0, // Would need to count readings in date range
          status: 'completed',
          fileUrl: undefined, // Reports don't have file URLs in current implementation
          summary: {
            avgTVOC: 0, // Would need to calculate from readings
            avgECO2: 0,
            avgTemperature: 0,
            avgHumidity: 0
          }
        }))
        setReports(transformedReports)
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

  const handleDownload = (report: Report) => {
    if (report.fileUrl) {
      // Create a temporary link to download the file
      const link = document.createElement('a')
      link.href = report.fileUrl
      link.download = `${report.title}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
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

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
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
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar 
        user={user} 
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="flex">
        {/* Sidebar */}
        <DashboardSidebar user={user} onLogout={handleLogout} />

        {/* Main Content */}
        <div className="flex-1 lg:ml-72">
          <div className="py-6 pl-1 pr-4 sm:pl-2 sm:pr-6 lg:pl-2 lg:pr-8">
          <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Reports & Analytics
                </h1>
                <p className="text-gray-600">
                  View and download your respiratory health analysis reports
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" className="flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Download className="w-4 h-4 mr-2" />
                  Export All
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Reports</p>
                      <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
                    </div>
                    <FileText className="w-8 h-8 text-green-600" />
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
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Readings</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reports.reduce((sum, report) => sum + report.readings, 0).toLocaleString()}
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-600" />
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
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg TVOC</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.round(reports.reduce((sum, report) => sum + report.summary.avgTVOC, 0) / reports.length)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-600" />
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
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg eCO₂</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.round(reports.reduce((sum, report) => sum + report.summary.avgECO2, 0) / reports.length)}
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Analytics Charts */}
          {reports.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                      value: Math.round(reports.reduce((sum, report) => sum + report.summary.avgTVOC, 0) / reports.length),
                      color: '#10b981',
                      trend: 'up'
                    },
                    {
                      label: 'eCO₂ (ppm)',
                      value: Math.round(reports.reduce((sum, report) => sum + report.summary.avgECO2, 0) / reports.length),
                      color: '#3b82f6',
                      trend: 'stable'
                    },
                    {
                      label: 'Temperature (°C)',
                      value: Math.round(reports.reduce((sum, report) => sum + report.summary.avgTemperature, 0) / reports.length),
                      color: '#f59e0b',
                      trend: 'stable'
                    },
                    {
                      label: 'Humidity (%)',
                      value: Math.round(reports.reduce((sum, report) => sum + report.summary.avgHumidity, 0) / reports.length),
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
          <div className="space-y-4">
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {report.title}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                            {report.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{report.date.toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{report.duration}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Activity className="w-4 h-4" />
                            <span>{report.readings} readings</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4" />
                            <span>TVOC: {report.summary.avgTVOC.toFixed(1)} ppb</span>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">TVOC:</span>
                            <span className="ml-2 font-medium">{report.summary.avgTVOC.toFixed(1)} ppb</span>
                          </div>
                          <div>
                            <span className="text-gray-500">eCO₂:</span>
                            <span className="ml-2 font-medium">{report.summary.avgECO2.toFixed(1)} ppm</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Temp:</span>
                            <span className="ml-2 font-medium">{report.summary.avgTemperature.toFixed(1)}°C</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Humidity:</span>
                            <span className="ml-2 font-medium">{report.summary.avgHumidity.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReport(report)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        {report.status === 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => handleDownload(report)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
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
              className="text-center py-12"
            >
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No reports available
              </h3>
              <p className="text-gray-600 mb-6">
                Start a breathing session to generate your first report
              </p>
              <Button className="bg-green-600 hover:bg-green-700">
                Start New Session
              </Button>
            </motion.div>
          )}
          </div>
          </div>
        </div>
      </div>

      {/* Report Viewer Modal */}
      {selectedReport && (
        <ReportViewerModal
          isOpen={isViewerOpen}
          onClose={handleCloseViewer}
          reportId={selectedReport.id}
        />
      )}
    </div>
  )
}
