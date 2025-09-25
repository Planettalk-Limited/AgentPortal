'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { api, User, ApiError, RegisterRequest } from '@/lib/api'
import { getCurrentLocaleFromPath, createLocalizedPath } from '@/lib/locale-utils'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ requires2FA: boolean; email?: string }>
  register: (data: RegisterRequest) => Promise<{ success: boolean; message: string }>
  verify2FA: (email: string, code: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  clearError: () => void
  hasRole: (roles: string | string[]) => boolean
  hasPermission: (permission: string) => boolean
}

interface AuthProviderProps {
  children: ReactNode
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/apply',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/public',
  '/about',
  '/contact',
  '/privacy',
  '/privacy-policy',
  '/terms',
  '/terms-and-conditions',
  '/cookies',
  '/referral'
]

// Routes that require specific roles
const ROLE_PROTECTED_ROUTES = {
  '/admin': ['admin', 'pt_admin'],
  '/agent': ['agent', 'admin', 'pt_admin'], // Allow admins to access agent functionality
  '/dashboard': ['admin', 'pt_admin', 'agent']
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const localeFromHook = useLocale()

  // Get current locale using reliable detection
  const locale = getCurrentLocaleFromPath(pathname)

  // Helper function to create locale-aware paths
  const createPath = (path: string) => {
    return createLocalizedPath(locale, path)
  }

  // Check if current route is public
  const isPublicRoute = (path: string) => {
    const pathWithoutLocale = path.replace(`/${locale}`, '') || '/'
    return PUBLIC_ROUTES.some(route => 
      pathWithoutLocale === route || pathWithoutLocale.startsWith(route + '/')
    )
  }

  // Check if user has required role for current route
  const hasRequiredRole = (path: string, userRole?: string) => {
    if (!userRole) return false
    
    const pathWithoutLocale = path.replace(`/${locale}`, '') || '/'
    
    for (const [route, requiredRoles] of Object.entries(ROLE_PROTECTED_ROUTES)) {
      if (pathWithoutLocale.startsWith(route)) {
        return requiredRoles.includes(userRole)
      }
    }
    
    return true // Default allow if no specific role requirement
  }

  // Initialize authentication
  useEffect(() => {
    initializeAuth()
  }, [])

  // Handle route protection
  useEffect(() => {
    if (!loading) {
      handleRouteProtection()
    }
  }, [loading, user, pathname])

  const initializeAuth = async () => {
    try {
      setLoading(true)
      setError(null)

      // Try to get stored user
      const storedUser = api.auth.initializeAuth()
      
      if (storedUser) {
        // Validate token by fetching fresh user data
        try {
          const freshUser = await api.auth.getProfile()
          setUser(freshUser)
          
          // Update stored user if there are differences
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(freshUser))
          }
        } catch (error) {
          // Token is invalid, clear auth
          await clearAuth()
        }
      }
    } catch (error) {
      setError('Authentication initialization failed')
      await clearAuth()
    } finally {
      setLoading(false)
    }
  }

  const handleRouteProtection = () => {
    const currentPath = pathname

    // If user is not authenticated and trying to access protected route
    if (!user && !isPublicRoute(currentPath)) {
      router.push(createPath('/auth/login'))
      return
    }

    // If user is authenticated but doesn't have required role
    if (user && !hasRequiredRole(currentPath, user.role)) {
      // Redirect based on user role
      switch (user.role) {
        case 'admin':
        case 'pt_admin':
          router.push(createPath('/admin/dashboard'))
          break
        case 'agent':
          router.push(createPath('/agent'))
          break
        default:
          router.push(createPath('/dashboard'))
      }
      return
    }

    // If authenticated user is on auth pages, redirect to appropriate dashboard
    if (user && currentPath.includes('/auth/')) {
      switch (user.role) {
        case 'admin':
        case 'pt_admin':
          router.push(createPath('/admin/dashboard'))
          break
        case 'agent':
          router.push(createPath('/agent'))
          break
        default:
          router.push(createPath('/dashboard'))
      }
    }
  }

  const register = async (data: RegisterRequest): Promise<{ success: boolean; message: string }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.auth.register(data)
      
      return { 
        success: response.success, 
        message: response.message 
      }
    } catch (error) {
      const apiError = error as ApiError
      // Provide user-friendly error message for common registration errors
      if (apiError.statusCode === 400 && apiError.error?.includes('email already exists')) {
        setError('An account with this email already exists. Please use a different email or try logging in.')
      } else {
        setError(apiError.error || 'Registration failed. Please try again.')
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<{ requires2FA: boolean; email?: string }> => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.auth.login({ email, password })
      
      // Check if 2FA is required
      if (response.requires2FA) {
        return { requires2FA: true, email: response.email || email }
      }

      // Normal login - set user and redirect
      setUser(response.user)

      // Redirect based on user role
      switch (response.user.role) {
        case 'admin':
        case 'pt_admin':
          router.push(createPath('/admin/dashboard'))
          break
        case 'agent':
          router.push(createPath('/agent'))
          break
        default:
          router.push(createPath('/dashboard'))
      }

      return { requires2FA: false }
    } catch (error) {
      const apiError = error as ApiError
      // Provide user-friendly error message for 401 (invalid credentials)
      if (apiError.statusCode === 401) {
        setError('Invalid email or password. Please check your credentials and try again.')
      } else {
        setError(apiError.error || 'Login failed')
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  const verify2FA = async (email: string, code: string): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.auth.verify2FA({ email, code })
      setUser(response.user)

      // Redirect based on user role after successful 2FA
      switch (response.user.role) {
        case 'admin':
        case 'pt_admin':
          router.push(createPath('/admin/dashboard'))
          break
        case 'agent':
          router.push(createPath('/agent'))
          break
        default:
          router.push(createPath('/dashboard'))
      }
    } catch (error) {
      const apiError = error as ApiError
      // Provide user-friendly error message for 401 (invalid code)
      if (apiError.statusCode === 401) {
        setError('Invalid verification code. Please check the code and try again.')
      } else {
        setError(apiError.error || '2FA verification failed')
      }
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await api.auth.logout()
    } catch (error) {
      // Logout API call failed - continue with client-side cleanup
    } finally {
      await clearAuth()
      router.push(createPath('/'))
    }
  }

  const clearAuth = async () => {
    setUser(null)
    setError(null)
    api.auth.clearAuth()
    setLoading(false)
  }

  const refreshUser = async () => {
    try {
      setError(null)
      const freshUser = await api.auth.getProfile()
      setUser(freshUser)
      
      // Update stored user
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(freshUser))
      }
    } catch (error) {
      setError('Failed to refresh user data')
      // Don't clear auth on refresh failure, just show error
    }
  }

  const clearError = () => {
    setError(null)
  }

  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false
    
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    
    // Define permissions based on roles
    const permissions = {
      admin: [
        'users.manage',
        'agents.manage',
        'payouts.manage',
        'system.admin',
        'reports.view',
        'notifications.manage',
        'training.manage'
      ],
      pt_admin: [
        'users.manage',
        'agents.manage',
        'payouts.manage',
        'reports.view',
        'notifications.manage',
        'training.manage'
      ],
      agent: [
        'profile.update',
        'payouts.request',
        'earnings.view',
        'referrals.manage',
        'training.access'
      ]
    }

    const userPermissions = permissions[user.role as keyof typeof permissions] || []
    return userPermissions.includes(permission)
  }

  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    verify2FA,
    logout,
    refreshUser,
    clearError,
    hasRole,
    hasPermission
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Higher-order component for route protection
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles?: string[]
) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading, hasRole } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    
    // Get current locale using reliable detection
    const locale = getCurrentLocaleFromPath(pathname)

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.push(createLocalizedPath(locale, '/auth/login'))
          return
        }

        if (requiredRoles && !hasRole(requiredRoles)) {
          router.push(createLocalizedPath(locale, '/dashboard'))
          return
        }
      }
    }, [user, loading, router, locale, pathname])

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pt-turquoise mx-auto mb-4"></div>
            <p className="text-pt-light-gray">Loading...</p>
          </div>
        </div>
      )
    }

    if (!user) {
      return null
    }

    if (requiredRoles && !hasRole(requiredRoles)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}
