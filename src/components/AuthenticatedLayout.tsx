'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import DashboardSidebar from './DashboardSidebar'
import DashboardHeader from './DashboardHeader'
import DashboardFooter from './DashboardFooter'

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

const AuthenticatedLayout = ({ children }: AuthenticatedLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, loading } = useAuth()

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [mobileMenuOpen])

  // Close mobile menu when clicking outside
  const handleOverlayClick = () => {
    setMobileMenuOpen(false)
  }

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [mobileMenuOpen])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pt-turquoise mx-auto mb-4"></div>
          <p className="text-pt-light-gray">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect by AuthProvider
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={handleOverlayClick}
        />
      )}
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          isMobile={false}
          isOpen={true}
        />
      </div>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <DashboardSidebar 
          collapsed={false} 
          onToggle={toggleMobileMenu}
          isMobile={true}
          isOpen={mobileMenuOpen}
        />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <DashboardHeader 
          onToggleMobileMenu={toggleMobileMenu}
        />
        
        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
        
        {/* Footer */}
        <DashboardFooter />
      </div>
    </div>
  )
}

export default AuthenticatedLayout
