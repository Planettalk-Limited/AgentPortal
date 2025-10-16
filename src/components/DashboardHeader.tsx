'use client'

import { useState, useRef, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import LanguageSelector from './LanguageSelector'

interface DashboardHeaderProps {
  onToggleMobileMenu?: () => void
}

const DashboardHeader = ({ onToggleMobileMenu }: DashboardHeaderProps) => {
  const locale = useLocale()
  const t = useTranslations('navigation')
  const { user, logout } = useAuth()
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Helper function to create locale-aware links
  const createLocalizedPath = (path: string) => {
    return `/${locale}${path}`
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout()
      setUserDropdownOpen(false)
    } catch (error) {
      // Error handling is done by auth context
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on escape key and handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close dropdown on escape
      if (e.key === 'Escape' && userDropdownOpen) {
        setUserDropdownOpen(false)
        return
      }
      
      // Quick logout with Ctrl/Cmd + Shift + L
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        handleLogout()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [userDropdownOpen])

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 h-16 flex items-center px-4 sm:px-6 w-full overflow-hidden flex-shrink-0">
      {/* Left side - Mobile hamburger menu */}
      <div className="flex items-center flex-shrink-0">
        {/* Mobile hamburger menu */}
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 lg:hidden"
        >
          <svg className="w-5 h-5 text-pt-dark-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Right side - User menu and Language selector */}
      <div className="flex items-center space-x-2 sm:space-x-4 ml-auto flex-shrink-0">
        <LanguageSelector />
        
        {/* User Dropdown */}
        {user && (
          <div className="relative flex-shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              aria-expanded={userDropdownOpen}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 bg-pt-turquoise rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-medium">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </span>
              </div>
              <div className="hidden sm:block text-left min-w-0 max-w-[150px]">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-xs text-gray-500 capitalize truncate">
                  {user.role}
                </div>
              </div>
              <svg 
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  userDropdownOpen ? 'rotate-180' : ''
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div 
                className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 z-[9999]" 
                style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
              >
                {/* User Info Section */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-pt-turquoise to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white text-base font-semibold">
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {user.firstName}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {user.email}
                      </div>
                      <div className="text-xs text-pt-turquoise font-medium capitalize mt-0.5">
                        {user.role}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Menu Items */}
                <div className="py-1">
                  <Link
                    href={createLocalizedPath('/profile')}
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">{t('profile')}</span>
                  </Link>
                </div>
                
                {/* Logout Section */}
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-between w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 group"
                  >
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-3 text-red-500 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="font-medium">{t('signOut')}</span>
                    </div>
                    <span className="text-xs text-gray-400 font-mono opacity-70">
                      ⌘⇧L
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

export default DashboardHeader
