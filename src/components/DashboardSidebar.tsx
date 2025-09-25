'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useAuth } from '@/contexts/AuthContext'
import PlanetTalkLogo from './PlanetTalkLogo'

interface DashboardSidebarProps {
  collapsed: boolean
  onToggle: () => void
  isMobile?: boolean
  isOpen?: boolean
}

const DashboardSidebar = ({ collapsed, onToggle, isMobile = false, isOpen = true }: DashboardSidebarProps) => {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const localeFromHook = useLocale()
  const t = useTranslations('navigation')

  // Get current locale from pathname as primary source, with fallback to stored preference
  const getCurrentLocale = () => {
    // Extract locale from pathname first (most reliable)
    const pathSegments = pathname.split('/').filter(Boolean)
    const localeFromPath = ['en', 'fr', 'pt', 'es'].includes(pathSegments[0]) ? pathSegments[0] : null
    
    if (localeFromPath) {
      return localeFromPath
    }
    
    // Fallback to stored preference if available
    if (typeof window !== 'undefined') {
      const storedLocale = localStorage.getItem('preferred_locale')
      if (storedLocale && ['en', 'fr', 'pt', 'es'].includes(storedLocale)) {
        return storedLocale
      }
    }
    
    // Final fallback to default
    return 'en'
  }

  const locale = getCurrentLocale()

  // Helper function to create locale-aware links
  const createLocalizedPath = (path: string) => {
    return `/${locale}${path}`
  }

  const handleLogout = async () => {
    try {
      await logout()
      // Navigation is handled by the auth context
    } catch (error) {
      // Logout error handled by auth context
    }
  }

  // Navigation items based on user role
  const getNavItems = () => {
    // Basic user pages (always visible)
    const basicItems = [
      { 
        href: createLocalizedPath('/dashboard'), 
        label: 'My Dashboard', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        )
      },
      { 
        href: createLocalizedPath('/agent'), 
        label: 'Agent Program', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        )
      },
      { 
        href: createLocalizedPath('/profile'), 
        label: 'My Profile', 
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      },
    ]

    // Admin pages (only for admin users)
    const adminItems = []
    if (user && (user.role === 'admin' || user.role === 'pt_admin')) {
      adminItems.push(
        { 
          href: createLocalizedPath('/admin/dashboard'), 
          label: 'Overview', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        { 
          href: createLocalizedPath('/admin/users'), 
          label: 'Users', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )
        },
        { 
          href: createLocalizedPath('/admin/payouts'), 
          label: 'Payouts', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        { 
          href: createLocalizedPath('/admin/agents'), 
          label: 'Agents', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          )
        },
        { 
          href: createLocalizedPath('/admin/earnings'), 
          label: 'Earnings', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          )
        },
      )
    }

    return { basicItems, adminItems }
  }

  const { basicItems, adminItems } = getNavItems()

  // Helper function to render navigation items
  const renderNavItems = (items: any[], isCollapsed: boolean) => {
    if (!items || !Array.isArray(items)) {
      return null
    }
    
    return items.map((item) => {
      // More flexible matching for active state
      const isActive = pathname === item.href || 
                       (pathname.startsWith(item.href) && item.href !== createLocalizedPath('/'))
      
      return (
        <li key={item.href}>
          <Link
            href={item.href}
            onClick={() => {
              // Close mobile menu when navigation item is clicked
              if (isMobile) {
                onToggle()
              }
            }}
            className={`flex items-center px-3 py-2 rounded-lg transition-colors duration-200 ${
              isActive
                ? 'bg-pt-turquoise text-white'
                : 'text-pt-dark-gray hover:bg-gray-100 hover:text-pt-turquoise'
            }`}
            title={isCollapsed ? item.label : ''}
          >
            <span className="flex-shrink-0">
              {item.icon}
            </span>
            {!isCollapsed && (
              <span className="ml-3 font-medium">{item.label}</span>
            )}
          </Link>
        </li>
      )
    })
  }

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      isMobile 
        ? 'w-64 h-screen' 
        : collapsed 
        ? 'w-16' 
        : 'w-64'
    } flex flex-col ${isMobile ? 'h-full' : 'h-screen sticky top-0'}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {(!collapsed || isMobile) && (
            <Link href={createLocalizedPath('/dashboard')} className="flex items-center space-x-3">
              <PlanetTalkLogo className="h-8 w-auto" />
            </Link>
          )}
          
          {/* Toggle button - different behavior for mobile vs desktop */}
          {isMobile ? (
            /* Mobile close button */
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5 text-pt-dark-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            /* Desktop collapse button */
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg 
                className={`w-5 h-5 text-pt-dark-gray transition-transform duration-300 ${
                  collapsed ? 'rotate-180' : ''
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6">
        {/* Basic User Pages */}
        <div>
          {(!collapsed || isMobile) && (
            <h3 className="text-xs font-semibold text-pt-light-gray uppercase tracking-wider mb-3">
              Main
            </h3>
          )}
          <ul className="space-y-2">
            {renderNavItems(basicItems, collapsed && !isMobile)}
          </ul>
        </div>

        {/* Admin Pages */}
        {adminItems.length > 0 && (
          <div>
            {(!collapsed || isMobile) && (
              <h3 className="text-xs font-semibold text-pt-light-gray uppercase tracking-wider mb-3">
                Administration
              </h3>
            )}
            <ul className="space-y-2">
              {renderNavItems(adminItems, collapsed && !isMobile)}
            </ul>
          </div>
        )}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        {user && (
          <div className="space-y-3">
            {/* User Info */}
            <div className={`flex items-center ${(collapsed && !isMobile) ? 'justify-center' : 'space-x-3'}`}>
              <div className="w-8 h-8 bg-pt-turquoise rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-medium">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </span>
              </div>
              {(!collapsed || isMobile) && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-pt-dark-gray truncate">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-xs text-pt-light-gray capitalize">
                    {user.role}
                  </div>
                </div>
              )}
              {/* Desktop compact logout button */}
              {(collapsed && !isMobile) && (
                <button
                  onClick={handleLogout}
                  className="p-1 text-pt-light-gray hover:text-red-500 transition-colors duration-200"
                  title="Sign Out"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Mobile/Expanded Logout Button */}
            {(!collapsed || isMobile) && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {t('signOut')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardSidebar
