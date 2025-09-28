'use client'

import { ReactNode, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardSidebar } from './dashboard-sidebar'
import { Navbar } from '../shared/navbar'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
      setIsLoading(false)
    } else {
      router.push('/auth/login')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
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
        onMobileMenuToggle={() => {}}
      />

      <div className="flex">
        {/* Sidebar - This will persist across page navigations */}
        <DashboardSidebar user={user} onLogout={handleLogout} />

        {/* Main Content */}
        <div className="flex-1 lg:ml-72">
          {children}
        </div>
      </div>
    </div>
  )
}
