'use client'

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
          href: createLocalizedPath('/media'), 
          label: t('media'), 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2a2 2 0 002 2m0 0h14" />
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

    // Support items
    const supportItems: any[] = [
      {
        href: 'https://www.whatsapp.com/channel/0029VbAgkQJJf05cXRvh8e3s',
        label: t('joinOurChannel'),
        external: true,
        icon: (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        )
      }
    ]

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
          href: createLocalizedPath('/admin/resources'), 
          label: 'Resources', 
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
      // More flexible matching for active state
      const isActive = item.href && (() => {
        // Exact match first
        if (pathname === item.href) return true
        
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
      
      // Handle external links
      if (item.external) {
        return (
          <li key={item.href}>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                // Close mobile menu when navigation item is clicked
                if (isMobile) {
                  onToggle()
                }
              }}
              className="flex items-center px-3 py-2 rounded-lg transition-colors duration-200 text-pt-dark-gray hover:bg-gray-100 hover:text-pt-turquoise"
              title={isCollapsed ? item.label : ''}
            >
              <span className="flex-shrink-0">
                {item.icon}
              </span>
              {(!isCollapsed || isMobile) && (
                <span className="ml-3 font-medium">{item.label}</span>
              )}
            </a>
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
    } ${isMobile ? 'flex flex-col h-full' : 'fixed top-0 bottom-0 left-0 flex flex-col overflow-y-auto'}`} style={!isMobile ? { WebkitOverflowScrolling: 'touch' } : {}}>
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

        {/* Support Section */}
        {supportItems.length > 0 && (
          <div>
            {(!collapsed || isMobile) && (
              <h3 className="text-xs font-semibold text-pt-light-gray uppercase tracking-wider mb-3">
                {t('support')}
              </h3>
            )}
            <ul className="space-y-2">
              {renderNavItems(supportItems, collapsed && !isMobile)}
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
