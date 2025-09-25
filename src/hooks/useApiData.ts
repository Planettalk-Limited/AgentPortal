/**
 * Unified API Data Hook
 * Standardizes data fetching patterns across components
 */

import { useState, useEffect, useCallback } from 'react'

export interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  clearError: () => void
}

export function useApiData<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  options: {
    immediate?: boolean
    onSuccess?: (data: T) => void
    onError?: (error: string) => void
  } = {}
): ApiState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(options.immediate !== false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await fetchFn()
      setData(result)
      
      options.onSuccess?.(result)
    } catch (err: any) {
      const errorMessage = err?.error || err?.message || 'An error occurred'
      setError(errorMessage)
      options.onError?.(errorMessage)
      // API Error occurred
    } finally {
      setLoading(false)
    }
  }, [fetchFn, options])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  useEffect(() => {
    if (options.immediate !== false) {
      fetchData()
    }
  }, dependencies)

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    clearError
  }
}

// Specialized hook for paginated data
export function usePaginatedData<T>(
  fetchFn: (params: any) => Promise<{ data: T[]; total: number; page: number }>,
  initialParams: any = {},
  options: {
    immediate?: boolean
    onSuccess?: (data: { data: T[]; total: number; page: number }) => void
    onError?: (error: string) => void
  } = {}
) {
  const [params, setParams] = useState(initialParams)
  
  const apiState = useApiData(
    () => fetchFn(params),
    [params],
    options
  )

  const updateParams = useCallback((newParams: Partial<typeof params>) => {
    setParams((prev: any) => ({ ...prev, ...newParams }))
  }, [])

  const nextPage = useCallback(() => {
    setParams((prev: any) => ({ ...prev, page: (prev.page || 1) + 1 }))
  }, [])

  const prevPage = useCallback(() => {
    setParams((prev: any) => ({ ...prev, page: Math.max((prev.page || 1) - 1, 1) }))
  }, [])

  return {
    ...apiState,
    params,
    updateParams,
    nextPage,
    prevPage,
    items: apiState.data?.data || [],
    total: apiState.data?.total || 0,
    currentPage: apiState.data?.page || 1
  }
}

// Hook for form submissions
export function useApiSubmit<T, K = any>(
  submitFn: (data: K) => Promise<T>,
  options: {
    onSuccess?: (data: T) => void
    onError?: (error: string) => void
    resetOnSuccess?: boolean
  } = {}
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const submit = useCallback(async (data: K) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)
      
      const result = await submitFn(data)
      setSuccess(true)
      
      options.onSuccess?.(result)
      
      // Auto-clear success after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
      
      return result
    } catch (err: any) {
      const errorMessage = err?.error || err?.message || 'An error occurred'
      setError(errorMessage)
      options.onError?.(errorMessage)
      // Submit Error occurred
      throw err
    } finally {
      setLoading(false)
    }
  }, [submitFn, options])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const clearSuccess = useCallback(() => {
    setSuccess(false)
  }, [])

  return {
    submit,
    loading,
    error,
    success,
    clearError,
    clearSuccess
  }
}

// Hook for multiple API calls
export function useMultipleApiData<T extends Record<string, any>>(
  fetchers: { [K in keyof T]: () => Promise<T[K]> },
  dependencies: any[] = [],
  options: {
    immediate?: boolean
    onSuccess?: (data: T) => void
    onError?: (error: string) => void
  } = {}
) {
  const [data, setData] = useState<Partial<T>>({})
  const [loading, setLoading] = useState(options.immediate !== false)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const results = await Promise.allSettled(
        Object.entries(fetchers).map(async ([key, fetchFn]) => {
          const result = await fetchFn()
          return { key, result }
        })
      )

      const newData: Partial<T> = {}
      let hasError = false

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const { key, result: value } = result.value
          newData[key as keyof T] = value
        } else {
          hasError = true
          // Failed to fetch data
        }
      })

      if (hasError) {
        setError('Some data failed to load')
      }

      setData(newData)
      
      if (!hasError && Object.keys(newData).length === Object.keys(fetchers).length) {
        options.onSuccess?.(newData as T)
      }
    } catch (err: any) {
      const errorMessage = err?.error || err?.message || 'Failed to load data'
      setError(errorMessage)
      options.onError?.(errorMessage)
      // Multiple API Error occurred
    } finally {
      setLoading(false)
    }
  }, [fetchers, options])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  useEffect(() => {
    if (options.immediate !== false) {
      fetchAll()
    }
  }, dependencies)

  return {
    data,
    loading,
    error,
    refetch: fetchAll,
    clearError
  }
}

export default useApiData
