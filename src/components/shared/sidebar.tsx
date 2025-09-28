'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/utils'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Smartphone, 
  FileText, 
  LogOut, 
  Menu,
  X,
  Activity,
  User
} from 'lucide-react'

interface SidebarProps {
  user?: {
    name: string
    email: string
  }
  onLogout?: () => void
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and real-time data'
  },
  {
    name: 'Device',
    href: '/dashboard/device',
    icon: Smartphone,
    description: 'ESP32 device management'
  },
  {
    name: 'Reports',
    href: '/dashboard/reports',
    icon: FileText,
    description: 'Data analysis and exports'
  }
]

export function Sidebar({ user, onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white/80 backdrop-blur-sm"
        >
          {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-80 bg-white border-r border-gray-200 shadow-xl",
          "lg:translate-x-0 lg:static lg:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ROVOCS</h1>
                <p className="text-xs text-gray-500">Respiratory Health Monitor</p>
              </div>
            </motion.div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-6 space-y-2">
            {navigationItems.map((item, index) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
                      "hover:bg-green-50 hover:text-green-700",
                      isActive
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "text-gray-600 hover:bg-green-50"
                    )}
                  >
                    <Icon className={cn(
                      "w-5 h-5",
                      isActive ? "text-green-600" : "text-gray-400"
                    )} />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="w-2 h-2 bg-green-600 rounded-full"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.div>
              )
            })}
          </nav>

          {/* User section */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 border-t border-gray-200"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              
              {onLogout && (
                <Button
                  onClick={onLogout}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-gray-600 hover:text-red-600 hover:border-red-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </motion.aside>
    </>
  )
}

