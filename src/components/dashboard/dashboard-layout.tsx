'use client'

import { ReactNode } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { DashboardSidebar } from './dashboard-sidebar'
import { Navbar } from '../shared/navbar'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const user = {
    id: (session.user as { id?: string }).id || session.user.email || '',
    name: session.user.name || '',
    email: session.user.email || ''
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
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
