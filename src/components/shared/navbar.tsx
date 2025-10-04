'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'
import { 
  Bell, 
  Settings, 
  Menu,
  Activity,
  User,
  Moon,
  Sun,
  HelpCircle
} from 'lucide-react'

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  timestamp: string
  isRead: boolean
  icon: string
  color: string
}

interface NavbarProps {
  user?: {
    id: string
    name: string
    email: string
  }
  onMobileMenuToggle?: () => void
  showMobileMenuButton?: boolean
}

export function Navbar({ user, onMobileMenuToggle, showMobileMenuButton = true }: NavbarProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationsError, setNotificationsError] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return
    
    try {
      setNotificationsLoading(true)
      setNotificationsError(false)
      
      const response = await fetch(`/api/notifications?userId=${user.id}&limit=10`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
        setNotificationsError(false)
      } else {
        console.warn('Failed to fetch notifications:', response.status, response.statusText)
        setNotifications([])
        setUnreadCount(0)
        setNotificationsError(true)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setNotifications([])
      setUnreadCount(0)
      setNotificationsError(true)
    } finally {
      setNotificationsLoading(false)
    }
  }, [user?.id])

  const markNotificationsAsRead = useCallback(async (notificationIds?: string[]) => {
    if (!user?.id) return
    
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          notificationIds: notificationIds,
          action: notificationIds ? 'markAsRead' : 'markAllAsRead'
        })
      })
      
      if (response.ok) {
        // Refresh notifications to update the UI
        await fetchNotifications()
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error)
    }
  }, [user?.id, fetchNotifications])

  useEffect(() => {
    if (user?.id) {
      // Add a small delay to prevent race conditions
      const timeoutId = setTimeout(() => {
        fetchNotifications()
      }, 100)
      
      return () => clearTimeout(timeoutId)
    }
  }, [user?.id, fetchNotifications])

  // Auto-mark notifications as read when dropdown is opened
  useEffect(() => {
    if (showNotifications && unreadCount > 0) {
      // Mark all notifications as read when dropdown is opened
      markNotificationsAsRead()
    }
  }, [showNotifications, unreadCount, markNotificationsAsRead])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.notification-dropdown') && !target.closest('.settings-dropdown')) {
        setShowNotifications(false)
        setShowSettings(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])


  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`
    return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) > 1 ? 's' : ''} ago`
  }

  return (
    <nav className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Mobile menu button and logo */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button - only show on mobile */}
            {showMobileMenuButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMobileMenuToggle}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}

            {/* Logo for mobile (hidden on desktop since sidebar shows it) */}
            <div className="flex items-center space-x-2 lg:hidden">
              <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">ROVOCS</span>
            </div>
          </div>


          {/* Right side - Actions and user */}
          <div className="flex items-center space-x-3">

            {/* Notifications */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative"
              >
                <Bell className="w-5 h-5" />
                {/* Notification badge */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-80 bg-white dark:bg-black rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 notification-dropdown"
                >
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Notifications</h3>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markNotificationsAsRead()}
                        className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                      >
                        Mark all as read
                      </Button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="px-4 py-6 text-center">
                        <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
                      </div>
                    ) : notificationsError ? (
                      <div className="px-4 py-6 text-center">
                        <p className="text-sm text-red-500 mb-2">Failed to load notifications</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={fetchNotifications}
                          className="text-xs"
                        >
                          Retry
                        </Button>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <p className="text-sm text-gray-500">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => {
                        return (
                          <div 
                            key={notification.id} 
                            className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 cursor-pointer ${
                              notification.isRead ? 'opacity-60' : 'bg-blue-50 dark:bg-blue-900/20'
                            }`}
                            onClick={() => {
                              if (!notification.isRead) {
                                markNotificationsAsRead([notification.id])
                              }
                            }}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                notification.color === 'green' ? 'bg-green-500' :
                                notification.color === 'blue' ? 'bg-blue-500' :
                                notification.color === 'purple' ? 'bg-purple-500' :
                                'bg-gray-500'
                              }`}></div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${
                                  notification.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'
                                }`}>{notification.title}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{formatTimeAgo(notification.timestamp)}</p>
                              </div>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                  <div className="px-4 py-2 border-t border-gray-100">
                    <Button variant="ghost" size="sm" className="w-full text-xs">
                      View all notifications
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Settings */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="relative"
              >
                <Settings className="w-5 h-5" />
              </Button>

              {/* Settings dropdown */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-64 bg-white dark:bg-black rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50 settings-dropdown"
          >
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Settings</h3>
                  </div>
                  
                  <div className="py-2">
                    {/* User Profile */}
                    <div 
                      className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => {
                        setShowSettings(false)
                        window.location.href = '/profile'
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Profile</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Manage your account</p>
                        </div>
                      </div>
                    </div>

                    {/* Dark Mode Toggle */}
                    <div className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={toggleTheme}>
                      <div className="flex items-center space-x-3">
                        {theme === 'dark' ? <Sun className="w-4 h-4 text-gray-500 dark:text-gray-400" /> : <Moon className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Toggle theme</p>
                        </div>
                        <div className={`w-8 h-4 rounded-full transition-colors ${
                          theme === 'dark' ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                            theme === 'dark' ? 'translate-x-4' : 'translate-x-0.5'
                          } mt-0.5`}></div>
                        </div>
                      </div>
                    </div>


                    {/* Help & Support */}
                    <div 
                      className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => {
                        setShowSettings(false)
                        window.location.href = '/help'
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <HelpCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Help</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Support & documentation</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </motion.div>
              )}
            </div>

          </div>
        </div>
      </div>


      {/* Overlay to close notifications */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </nav>
  )
}
