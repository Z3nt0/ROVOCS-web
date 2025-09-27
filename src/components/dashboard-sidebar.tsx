'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
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

interface DashboardSidebarProps {
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

export function DashboardSidebar({ user, onLogout }: DashboardSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-white shadow-md"
        >
          {isMobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-72 bg-white border-r border-gray-200 shadow-lg",
          "lg:translate-x-0 lg:shadow-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ROVOCS</h1>
                <p className="text-xs text-gray-500">Respiratory Health Monitor</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200",
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
                    <div className="w-2 h-2 bg-green-600 rounded-full" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User section - moved to bottom */}
          {user && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-green-600" />
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
                  className="w-full justify-start text-gray-600 hover:text-red-600 hover:border-red-200 h-8"
                >
                  <LogOut className="w-3 h-3 mr-2" />
                  <span className="text-xs">Sign Out</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
