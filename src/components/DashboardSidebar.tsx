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
    // Check if user is admin
    const isAdmin = user && (user.role === 'admin' || user.role === 'pt_admin')
    
    // Basic user pages (only for agents, not admins)
    const basicItems = []
    
    if (!isAdmin) {
      basicItems.push(
        { 
          href: createLocalizedPath('/dashboard'), 
          label: t('home'), 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          )
        },
        { 
          href: createLocalizedPath('/profile'), 
          label: t('myProfile'), 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        }
      )
    }

    // Support items (empty for now)
    const supportItems: any[] = []

    // Admin pages (only for admin users)
    const adminItems = []
    if (user && (user.role === 'admin' || user.role === 'pt_admin')) {
      adminItems.push(
        { 
          href: createLocalizedPath('/admin/dashboard'), 
          label: t('overview'), 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        { 
          href: createLocalizedPath('/admin/users'), 
          label: 'Admins', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )
        },
        { 
          href: createLocalizedPath('/admin/payouts'), 
          label: t('payouts'), 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          )
        },
        { 
          href: createLocalizedPath('/admin/earnings/bulk-upload'), 
          label: 'Bulk Upload', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          )
        },
        { 
          href: createLocalizedPath('/admin/agents'), 
          label: t('agents'), 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          )
        },
        { 
          href: createLocalizedPath('/admin/earnings'), 
          label: t('earnings'), 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          )
        },
      )
    }

    return { basicItems, adminItems, supportItems }
  }

  const { basicItems, adminItems, supportItems } = getNavItems()

  // Helper function to render navigation items
  const renderNavItems = (items: any[], isCollapsed: boolean) => {
    if (!items || !Array.isArray(items)) {
      return null
    }
    
    return items.map((item, index) => {
      // More flexible matching for active state with specific handling for earnings paths
      const isActive = item.href && (() => {
        // Exact match first
        if (pathname === item.href) return true
        
        // Special handling for earnings paths to prevent conflicts
        if (item.href.includes('/admin/earnings/bulk-upload')) {
          return pathname.includes('/admin/earnings/bulk-upload')
        }
        if (item.href === createLocalizedPath('/admin/earnings')) {
          return pathname === createLocalizedPath('/admin/earnings') || 
                 (pathname.startsWith(createLocalizedPath('/admin/earnings')) && 
                  !pathname.includes('/bulk-upload'))
        }
        
        // Default behavior for other paths
        return pathname.startsWith(item.href) && item.href !== createLocalizedPath('/')
      })()
      
      // Handle buttons (like chat)
      if (item.isButton) {
        return (
          <li key={`button-${index}`}>
            <button
              onClick={() => {
                item.onClick?.()
                // Close mobile menu when button is clicked
                if (isMobile) {
                  onToggle()
                }
              }}
              className="flex items-center px-3 py-2 rounded-lg transition-colors duration-200 w-full text-pt-dark-gray hover:bg-pt-turquoise-50 hover:text-pt-turquoise"
              title={isCollapsed ? item.label : ''}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {(!isCollapsed || isMobile) && (
                <span className="ml-3 font-medium">{item.label}</span>
              )}
            </button>
          </li>
        )
      }
      
      // Handle regular links
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
              {t('main')}
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
                {t('administration')}
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
                  title={t('signOut')}
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
