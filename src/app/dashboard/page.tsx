'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { StartSessionModal } from '@/components/device/start-session-modal'
import { ScheduleTestModal } from '@/components/device/schedule-test-modal'
import { RealTimeSession } from '@/components/dashboard/real-time-session'
import { Activity, BarChart3, FileText, Smartphone, TrendingUp, Clock } from 'lucide-react'

// interface User {
//   id: string
//   name: string
//   email: string
// }

interface DashboardStats {
  devices: {
    total: number
    connected: number
  }
  readings: {
    total: number
    recent: number
  }
  reports: {
    total: number
  }
  sessions: {
    total: number
    recent: number
  }
  averages: {
    tvoc: number
    eco2: number
    temperature: number
    humidity: number
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [isStartSessionModalOpen, setIsStartSessionModalOpen] = useState(false)
  const [isScheduleTestModalOpen, setIsScheduleTestModalOpen] = useState(false)
  const [isRealTimeSessionActive, setIsRealTimeSessionActive] = useState(false)
  const [currentSessionData, setCurrentSessionData] = useState<{ name: string; deviceId: string; duration: number } | null>(null)
  const [activity, setActivity] = useState<Array<{
    id: string
    type: string
    title: string
    description: string
    timestamp: string
    device?: string
    icon: string
    color: string
  }>>([])
  const [activityLoading, setActivityLoading] = useState(true)
  const router = useRouter()

  const fetchDashboardStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const userId = (session?.user as { id?: string })?.id
      if (!userId) return
      
      const response = await fetch(`/api/dashboard/stats?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [session?.user])

  const fetchActivity = useCallback(async () => {
    try {
      setActivityLoading(true)
      const userId = (session?.user as { id?: string })?.id
      if (!userId) return
      
      const response = await fetch(`/api/activity?userId=${userId}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setActivity(data)
      }
    } catch (error) {
      console.error('Error fetching activity:', error)
    } finally {
      setActivityLoading(false)
    }
  }, [session?.user])


  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true)
    } else if (status === 'unauthenticated') {
      // Redirect immediately to login if not authenticated
      router.replace('/auth/login')
    } else if (status === 'authenticated') {
      setIsLoading(false)
    }
  }, [status, router])

  useEffect(() => {
    const userId = (session?.user as { id?: string })?.id
    if (userId) {
      fetchDashboardStats()
      fetchActivity()
    }
  }, [session?.user, fetchDashboardStats, fetchActivity])

  // Add session refresh mechanism
  useEffect(() => {
    const refreshSession = async () => {
      if (status === 'authenticated' && session?.user) {
        // Store session info in localStorage as backup
        localStorage.setItem('user-session', JSON.stringify({
          userId: (session.user as { id?: string }).id,
          timestamp: Date.now()
        }))

        // Refresh session every 5 minutes to keep it alive
        const interval = setInterval(async () => {
          try {
            const response = await fetch('/api/auth/session', { method: 'GET' })
            if (response.ok) {
              const sessionData = await response.json()
              if (sessionData?.user) {
                // Update localStorage with fresh session data
                localStorage.setItem('user-session', JSON.stringify({
                  userId: (sessionData.user as { id?: string }).id,
                  timestamp: Date.now()
                }))
              }
            }
          } catch (error) {
            console.log('Session refresh failed:', error)
          }
        }, 5 * 60 * 1000) // 5 minutes

        return () => clearInterval(interval)
      } else if (status === 'unauthenticated') {
        // Try to restore session if we have stored data
        const storedSession = localStorage.getItem('user-session')
        if (storedSession) {
          const sessionData = JSON.parse(storedSession)
          const timeDiff = Date.now() - sessionData.timestamp
          if (timeDiff < 24 * 60 * 60 * 1000) {
            // Try to refresh the session immediately
            try {
              const response = await fetch('/api/auth/session', { method: 'GET' })
              if (response.ok) {
                const sessionData = await response.json()
                if (sessionData?.user) {
                  console.log('Session restored on mount')
                  localStorage.setItem('user-session', JSON.stringify({
                    userId: sessionData.user.id,
                    timestamp: Date.now()
                  }))
                }
              }
            } catch (error) {
              console.log('Session restoration on mount failed:', error)
            }
          }
        }
      }
    }

    refreshSession()
  }, [status, session])

  // Check localStorage for session backup on mount
  useEffect(() => {
    const checkStoredSession = async () => {
      const storedSession = localStorage.getItem('user-session')
      if (storedSession && status === 'unauthenticated') {
        const sessionData = JSON.parse(storedSession)
        const timeDiff = Date.now() - sessionData.timestamp
        // If session is less than 24 hours old, try to restore session
        if (timeDiff < 24 * 60 * 60 * 1000) {
          console.log('Recent session found, attempting to restore session')
          // Try to refresh the session
          try {
            const response = await fetch('/api/auth/session', { method: 'GET' })
            if (response.ok) {
              const sessionData = await response.json()
              if (sessionData?.user) {
                console.log('Session restored successfully')
                // Update localStorage with fresh data
                localStorage.setItem('user-session', JSON.stringify({
                  userId: (sessionData.user as { id?: string }).id,
                  timestamp: Date.now()
                }))
                return
              }
            }
          } catch (error) {
            console.log('Session restoration failed:', error)
          }
        } else {
          // Clear expired session
          localStorage.removeItem('user-session')
        }
      }
    }

    checkStoredSession()
  }, [status, router])

  // Handle page visibility changes to refresh session
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden && status === 'authenticated') {
        // Refresh session when user comes back to the tab
        try {
          await fetch('/api/auth/session', { method: 'GET' })
        } catch (error) {
          console.log('Session refresh on visibility change failed:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [status])



  const handleStartSession = () => {
    setIsStartSessionModalOpen(true)
  }

  const handleScheduleTest = () => {
    setIsScheduleTestModalOpen(true)
  }

  const handleSessionStart = (sessionData: { name: string; deviceId: string; duration: number }) => {
    console.log('Starting session:', sessionData)
    setCurrentSessionData(sessionData)
    setIsRealTimeSessionActive(true)
    setIsStartSessionModalOpen(false)
  }

  const handleEndSession = () => {
    setIsRealTimeSessionActive(false)
    setCurrentSessionData(null)
    // Refresh dashboard stats after session ends
    const userId = (session?.user as { id?: string })?.id
    if (userId) {
      fetchDashboardStats()
      fetchActivity()
    }
  }

  const handleTestSchedule = (scheduleData: { name: string; deviceId: string; date: string; time: string; duration: number; frequency: string; reminders: boolean }) => {
    console.log('Scheduling test:', scheduleData)
    // TODO: Implement actual scheduling logic
    alert(`Test "${scheduleData.name}" scheduled for ${new Date(`${scheduleData.date}T${scheduleData.time}`).toLocaleString()}!`)
  }

  if (status === 'loading' || isLoading) {
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

  // Don't render anything if we don't have a session and we're not loading
  // But also check if we have a stored session to prevent unnecessary redirects
  if (!session?.user && status === 'unauthenticated') {
    const storedSession = localStorage.getItem('user-session')
    if (storedSession) {
      const sessionData = JSON.parse(storedSession)
      const timeDiff = Date.now() - sessionData.timestamp
      // If we have a recent stored session, show loading instead of redirecting
      if (timeDiff < 24 * 60 * 60 * 1000) {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full"
            />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Restoring session...</p>
            </div>
          </div>
        )
      }
    }
    return null
  }

  return (
    <DashboardLayout>
      <div>
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to ROVOCS
              </h2>
              <p className="text-gray-600">
                Your respiratory health monitoring dashboard
              </p>
            </motion.div>

            {/* Getting Started - Top Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Getting Started</CardTitle>
                  <CardDescription>
                    Follow these steps to begin monitoring your respiratory health
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-green-600">1</span>
                      </div>
                      <p className="text-sm text-gray-600 flex-1">
                        Connect your ESP32 device to your Wi-Fi network
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-green-600">2</span>
                      </div>
                      <p className="text-sm text-gray-600 flex-1">
                        Pair your device with your account
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-green-600">3</span>
                      </div>
                      <p className="text-sm text-gray-600 flex-1">
                        Start breathing analysis sessions
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Middle Section - Two Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Quick Actions - Left Column */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex"
              >
                <Card className="flex-1 flex flex-col">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                      Common tasks and shortcuts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Button 
                        variant="outline" 
                        className="h-24 w-full flex flex-col items-center justify-center bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors text-center"
                        onClick={() => router.push('/device')}
                      >
                        <Smartphone className="w-6 h-6 mb-2 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700 text-center">Manage Devices</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-24 w-full flex flex-col items-center justify-center bg-green-50 border-green-200 hover:bg-green-100 hover:border-green-300 transition-colors text-center"
                        onClick={() => router.push('/reports')}
                      >
                        <BarChart3 className="w-6 h-6 mb-2 text-green-600" />
                        <span className="text-sm font-medium text-green-700 text-center">View Reports</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-24 w-full flex flex-col items-center justify-center bg-purple-50 border-purple-200 hover:bg-purple-100 hover:border-purple-300 transition-colors text-center"
                        onClick={() => handleStartSession()}
                      >
                        <Activity className="w-6 h-6 mb-2 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700 text-center">Start Session</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-24 w-full flex flex-col items-center justify-center bg-orange-50 border-orange-200 hover:bg-orange-100 hover:border-orange-300 transition-colors text-center"
                        onClick={() => handleScheduleTest()}
                      >
                        <Clock className="w-6 h-6 mb-2 text-orange-600" />
                        <span className="text-sm font-medium text-orange-700 text-center">Schedule Test</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Activity - Right Column */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex"
              >
                <Card className="flex-1 flex flex-col">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Latest sensor readings and device status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="grid grid-cols-1 gap-3">
                      {activityLoading ? (
                        <div className="text-center py-8">
                          <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                          <p className="text-sm text-gray-500 mt-2">Loading activity...</p>
                        </div>
                      ) : activity.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-sm text-gray-500">No recent activity</p>
                        </div>
                      ) : (
                        activity.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className={`w-2 h-2 rounded-full ${
                              item.color === 'green' ? 'bg-green-500' :
                              item.color === 'blue' ? 'bg-blue-500' :
                              item.color === 'purple' ? 'bg-purple-500' :
                              'bg-gray-500'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.title}</p>
                              <p className="text-xs text-gray-500 truncate">
                                {new Date(item.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Bottom Section - Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Connected
                    </CardTitle>
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {statsLoading ? '...' : stats?.devices.connected || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      of {stats?.devices.total || 0} devices online
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Sessions
                    </CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {statsLoading ? '...' : stats?.sessions.recent || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      sessions in last 24h
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Reports
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {statsLoading ? '...' : stats?.reports.total || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      total reports
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Avg TVOC Level
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {statsLoading ? '...' : stats?.averages.tvoc || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ppb average today
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </main>

          {/* Modals */}
          <StartSessionModal
            isOpen={isStartSessionModalOpen}
            onClose={() => setIsStartSessionModalOpen(false)}
            onStartSession={handleSessionStart}
          />
          
          <ScheduleTestModal
            isOpen={isScheduleTestModalOpen}
            onClose={() => setIsScheduleTestModalOpen(false)}
            onScheduleTest={handleTestSchedule}
          />

          {/* Real-time Session Overlay */}
          {isRealTimeSessionActive && currentSessionData && (
            <RealTimeSession
              sessionData={currentSessionData}
              onEndSession={handleEndSession}
            />
          )}
        </div>
    </DashboardLayout>
  )
}
