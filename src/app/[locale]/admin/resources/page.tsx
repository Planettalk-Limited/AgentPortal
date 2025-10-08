'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { api, Resource, ResourceQueryParams, UploadResourceRequest, UpdateResourceRequest } from '@/lib/api'

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedResources, setSelectedResources] = useState<string[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [stats, setStats] = useState<{
    total: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
    totalViews: number;
    recentUploads: number;
  }>({
    total: 0,
    byCategory: {},
    byType: {},
    totalViews: 0,
    recentUploads: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)

  const [filters, setFilters] = useState<ResourceQueryParams>({
    page: 1,
    limit: 20,
    search: '',
    category: '',
    type: '',
    visibility: '',
    sortBy: 'createdAt',
    sortOrder: 'DESC'
  })

  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    type: 'document' as const,
    category: 'training' as const,
    visibility: 'public' as const,
    isFeatured: false,
    tags: '',
    expiresAt: '',
    file: null as File | null
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  })

  const t = useTranslations('admin')
  const locale = useLocale()

  useEffect(() => {
    loadResources()
    loadStats()
  }, [filters])

  const loadResources = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.admin.getResources(filters)
      
      const resourcesData = (response as any).resources || response.data || []
      
      // The pagination data might be at the root level based on your API response
      const paginationData = (response as any).pagination || response
      
      setResources(Array.isArray(resourcesData) ? resourcesData : [])
      
      const newPagination = {
        page: parseInt(String(paginationData.page || filters.page || 1)),
        limit: parseInt(String(paginationData.limit || filters.limit || 20)),
        total: parseInt(String(paginationData.total || resourcesData.length || 0)),
        totalPages: parseInt(String(paginationData.totalPages || Math.ceil((paginationData.total || resourcesData.length || 0) / (paginationData.limit || filters.limit || 20))))
      }
      
      setPagination(newPagination)

    } catch (error: any) {
      setError('Failed to load resources')
      setResources([])
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      setStatsLoading(true)
      
      const statsData = await api.admin.getResourceStats()
      
      if (statsData && typeof statsData === 'object') {
        const newStats = {
          total: statsData.total || 0,
          byCategory: statsData.byCategory || {},
          byType: statsData.byType || {},
          totalViews: statsData.totalViews || 0,
          recentUploads: statsData.recentUploads || 0
        }
        
        setStats(newStats)
      } else {
        setStats({
          total: 0,
          byCategory: {},
          byType: {},
          totalViews: 0,
          recentUploads: 0
        })
      }
    } catch (error) {
      // Stats loading is optional - use defaults
      setStats({
        total: 0,
        byCategory: {},
        byType: {},
        totalViews: 0,
        recentUploads: 0
      })
    } finally {
      setStatsLoading(false)
    }
  }

  const validateForm = () => {
    const errors: string[] = []

    // File validation
    if (!uploadData.file) {
      errors.push('Please select a file to upload')
    } else {
      // File size validation (100MB = 104,857,600 bytes)
      if (uploadData.file.size > 104857600) {
        errors.push('File size must be less than 100MB')
      }
      
      // File type validation
      const allowedTypes = [
        // Documents
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain', 'text/csv',
        // Images
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        // Videos
        'video/mp4', 'video/avi', 'video/x-msvideo', 'video/quicktime',
        // Audio
        'audio/mpeg', 'audio/wav', 'audio/ogg',
        // Archives
        'application/zip', 'application/x-rar-compressed', 'application/x-tar', 'application/gzip'
      ]
      
      if (!allowedTypes.includes(uploadData.file.type)) {
        errors.push(`File type "${uploadData.file.type}" is not supported`)
      }
    }

    // Title validation
    if (!uploadData.title.trim()) {
      errors.push('Title is required')
    } else if (uploadData.title.length > 255) {
      errors.push('Title must be 255 characters or less')
    }

    // Description validation
    if (!uploadData.description.trim()) {
      errors.push('Description is required')
    }

    // Type validation
    const validTypes = ['document', 'image', 'video', 'audio', 'archive', 'other']
    if (!validTypes.includes(uploadData.type)) {
      errors.push('Please select a valid resource type')
    }

    // Category validation  
    const validCategories = ['training', 'marketing', 'compliance', 'announcement', 'policy', 'guide', 'template', 'bank_forms', 'terms_conditions', 'media', 'other']
    if (!validCategories.includes(uploadData.category)) {
      errors.push('Please select a valid category')
    }

    // Visibility validation
    const validVisibility = ['public', 'private', 'restricted']
    if (!validVisibility.includes(uploadData.visibility)) {
      errors.push('Please select a valid visibility level')
    }

    // Tags validation (if provided)
    if (uploadData.tags) {
      const tags = uploadData.tags.split(',').map(t => t.trim()).filter(t => t)
      if (tags.some(tag => tag.length > 50)) {
        errors.push('Each tag must be 50 characters or less')
      }
      if (tags.length > 20) {
        errors.push('Maximum 20 tags allowed')
      }
    }

    // Expiration date validation
    if (uploadData.expiresAt) {
      const expirationDate = new Date(uploadData.expiresAt)
      const now = new Date()
      if (expirationDate <= now) {
        errors.push('Expiration date must be in the future')
      }
    }

    return errors
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setError(validationErrors.join('; '))
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Type guard - we know file exists due to validation
      if (!uploadData.file) {
        setError('File is required')
        return
      }

      const uploadRequest: UploadResourceRequest = {
        file: uploadData.file,
        title: uploadData.title.trim(),
        description: uploadData.description.trim(),
        type: uploadData.type,
        category: uploadData.category,
        visibility: uploadData.visibility,
        isFeatured: uploadData.isFeatured,
        tags: uploadData.tags ? uploadData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
        expiresAt: uploadData.expiresAt || undefined
      }


      await api.admin.uploadResource(uploadRequest)
      
      setSuccess('Resource uploaded successfully!')
      setShowUploadModal(false)
      
      // Reset form data properly
      setUploadData({
        title: '',
        description: '',
        type: 'document',
        category: 'training',
        visibility: 'public',
        isFeatured: false,
        tags: '',
        expiresAt: '',
        file: null
      })
      
      // Clear any previous errors
      setError(null)
      
      // Refresh both resources and stats
      await Promise.all([
        loadResources(),
        loadStats()
      ])
      
    } catch (error: any) {
      // Handle API validation errors
      if (error.details && error.details.message && Array.isArray(error.details.message)) {
        setError(`API validation failed: ${error.details.message.join('; ')}`)
      } else if (error.message && Array.isArray(error.message)) {
        setError(`Validation errors: ${error.message.join('; ')}`)
      } else if (error.statusCode === 400) {
        setError(`Bad Request: Please check all required fields are filled correctly`)
      } else {
        setError(error.error || error.message || 'Failed to upload resource')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      return
    }

    try {
      await api.admin.deleteResource(id)
      setSuccess('Resource deleted successfully!')
      
      // Refresh both resources and stats
      await Promise.all([
        loadResources(),
        loadStats()
      ])
    } catch (error: any) {
      setError(error.message || 'Failed to delete resource')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedResources.length === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedResources.length} resources? This action cannot be undone.`)) {
      return
    }

    try {
      await api.admin.bulkDeleteResources({ resourceIds: selectedResources })
      setSuccess(`${selectedResources.length} resources deleted successfully!`)
      setSelectedResources([])
      
      // Refresh both resources and stats
      await Promise.all([
        loadResources(),
        loadStats()
      ])
    } catch (error: any) {
      setError(error.message || 'Failed to delete resources')
    }
  }

  const handleDownload = async (resource: Resource) => {
    try {
      const response = await api.admin.getResourceDownloadUrl(resource.id)
      
      if (response && response.url) {
        // Create a temporary link to download the file with proper filename
        const link = document.createElement('a')
        link.href = response.url
        link.download = resource.originalName || resource.fileName
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Show success message
        setSuccess(`Download started for ${resource.title}`)
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError('Download URL not available')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to generate download link')
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    }
    if (mimeType.startsWith('video/')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    }
    if (mimeType === 'application/pdf') {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    }
    // Default document icon
    return (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      training: 'bg-blue-100 text-blue-800',
      marketing: 'bg-green-100 text-green-800',
      compliance: 'bg-red-100 text-red-800',
      policy: 'bg-purple-100 text-purple-800',
      guide: 'bg-yellow-100 text-yellow-800',
      template: 'bg-indigo-100 text-indigo-800',
      other: 'bg-gray-100 text-gray-800'
    }
    return colors[category as keyof typeof colors] || colors.other
  }

  const getVisibilityColor = (visibility: string) => {
    const colors = {
      public: 'bg-green-100 text-green-800',
      private: 'bg-red-100 text-red-800',
      restricted: 'bg-yellow-100 text-yellow-800'
    }
    return colors[visibility as keyof typeof colors] || colors.public
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Resource Management</h1>
            <p className="text-gray-600">Upload and manage training materials, guides, and other resources</p>
          </div>
          <button
            onClick={() => {
              setShowUploadModal(true)
              setError(null)
              // Ensure clean form state
              setUploadData({
                title: '',
                description: '',
                type: 'document',
                category: 'training',
                visibility: 'public',
                isFeatured: false,
                tags: '',
                expiresAt: '',
                file: null
              })
            }}
            className="bg-pt-turquoise text-white px-6 py-3 rounded-lg hover:bg-pt-turquoise-600 transition-colors font-semibold"
          >
            + Upload Resource
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl mb-6 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto text-green-500 hover:text-green-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Resources</p>
              {statsLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              )}
            </div>
          </div>
        </div>


        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              {statsLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Recent Uploads</p>
              {statsLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">{stats.recentUploads}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">Filters & Search</h3>
            </div>
            <svg className={`w-5 h-5 text-gray-400 transform transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {filtersExpanded && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                  placeholder="Search resources..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value, page: 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise"
                >
                  <option value="">All Categories</option>
                  <option value="training">Training</option>
                  <option value="marketing">Marketing</option>
                  <option value="compliance">Compliance</option>
                  <option value="announcement">Announcement</option>
                  <option value="policy">Policy</option>
                  <option value="guide">Guide</option>
                  <option value="template">Template</option>
                  <option value="bank_forms">Bank Forms</option>
                  <option value="terms_conditions">Terms & Conditions</option>
                  <option value="media">Media</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={filters.type || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value, page: 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise"
                >
                  <option value="">All Types</option>
                  <option value="document">Document</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="audio">Audio</option>
                  <option value="archive">Archive</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                <select
                  value={filters.visibility || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, visibility: e.target.value, page: 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise"
                >
                  <option value="">All Visibility</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="restricted">Restricted</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <button
                onClick={() => setFilters({
                  page: 1,
                  limit: 20,
                  search: '',
                  category: '',
                  type: '',
                  visibility: '',
                  sortBy: 'createdAt',
                  sortOrder: 'DESC'
                })}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>

              {selectedResources.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Selected ({selectedResources.length})
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Resources Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Resources</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pt-turquoise mx-auto mb-4"></div>
            <p className="text-gray-600">Loading resources...</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-500">Upload your first resource to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedResources.length === resources.length && resources.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedResources(resources.map(r => r.id))
                        } else {
                          setSelectedResources([])
                        }
                      }}
                      className="h-4 w-4 text-pt-turquoise focus:ring-pt-turquoise border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visibility</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {resources.map((resource) => (
                  <tr key={resource.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedResources.includes(resource.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedResources([...selectedResources, resource.id])
                          } else {
                            setSelectedResources(selectedResources.filter(id => id !== resource.id))
                          }
                        }}
                        className="h-4 w-4 text-pt-turquoise focus:ring-pt-turquoise border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-100 rounded-lg mr-3 text-gray-600">
                          {getFileIcon(resource.mimeType)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {resource.title}
                            {resource.isFeatured && (
                              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                ⭐ Featured
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{resource.description}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {resource.originalName} • {formatFileSize(resource.fileSize)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(resource.category)}`}>
                        {resource.category.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {resource.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getVisibilityColor(resource.visibility)}`}>
                        {resource.visibility.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div>{resource.viewCount} views</div>
                        <div className="text-xs text-gray-500">
                          {new Date(resource.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownload(resource)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Download"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setEditingResource(resource)
                            setShowEditModal(true)
                          }}
                          className="text-green-600 hover:text-green-800 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(resource.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && resources.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} resources
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: Math.max(1, pagination.page - 1) }))}
                  disabled={pagination.page <= 1}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: Math.min(pagination.totalPages, pagination.page + 1) }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Upload New Resource</h3>
                <button
                  onClick={() => {
                    setShowUploadModal(false)
                    setError(null)
                    // Reset form data when closing modal
                    setUploadData({
                      title: '',
                      description: '',
                      type: 'document',
                      category: 'training',
                      visibility: 'public',
                      isFeatured: false,
                      tags: '',
                      expiresAt: '',
                      file: null
                    })
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-6">
              {/* Drag & Drop File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">File Upload</label>
                <div
                  onDrop={(e) => {
                    e.preventDefault()
                    const files = e.dataTransfer.files
                    if (files.length > 0) {
                      setUploadData(prev => ({ ...prev, file: files[0] }))
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => e.preventDefault()}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                    uploadData.file 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-300 hover:border-pt-turquoise hover:bg-pt-turquoise/5'
                  }`}
                >
                  <input
                    type="file"
                    onChange={(e) => setUploadData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  
                  {uploadData.file ? (
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{uploadData.file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(uploadData.file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setUploadData(prev => ({ ...prev, file: null }))
                        }}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove File
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Drag and drop your file here, or click to browse
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Supports: PDF, Word, Excel, PowerPoint, Images, Videos, Audio files
                        </p>
                        <p className="text-xs text-gray-500">Max file size: 100MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={uploadData.title}
                    onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pt-turquoise transition-colors ${
                      uploadData.title.length > 255 
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-gray-300 focus:border-pt-turquoise'
                    }`}
                    maxLength={255}
                    required
                  />
                  <div className="flex justify-between text-xs mt-1">
                    <span className={uploadData.title.length > 255 ? 'text-red-500' : 'text-gray-500'}>
                      {uploadData.title.length > 255 ? 'Title too long' : 'Required field'}
                    </span>
                    <span className={uploadData.title.length > 255 ? 'text-red-500' : 'text-gray-500'}>
                      {uploadData.title.length}/255
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={uploadData.category}
                    onChange={(e) => setUploadData(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise"
                  >
                    <option value="training">Training</option>
                    <option value="marketing">Marketing</option>
                    <option value="compliance">Compliance</option>
                    <option value="announcement">Announcement</option>
                    <option value="policy">Policy</option>
                    <option value="guide">Guide</option>
                    <option value="template">Template</option>
                    <option value="bank_forms">Bank Forms</option>
                    <option value="terms_conditions">Terms & Conditions</option>
                    <option value="media">Media</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={uploadData.type}
                    onChange={(e) => setUploadData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise"
                  >
                    <option value="document">Document</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                    <option value="archive">Archive</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                  <select
                    value={uploadData.visibility}
                    onChange={(e) => setUploadData(prev => ({ ...prev, visibility: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="restricted">Restricted</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise"
                  placeholder="Describe what this resource contains..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Required field</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <input
                    type="text"
                    value={uploadData.tags}
                    onChange={(e) => setUploadData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="training, manual, new-agent (comma separated)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {uploadData.tags ? `${uploadData.tags.split(',').filter(t => t.trim()).length}/20 tags` : 'Optional - comma separated'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expires At (Optional)</label>
                  <input
                    type="datetime-local"
                    value={uploadData.expiresAt}
                    onChange={(e) => setUploadData(prev => ({ ...prev, expiresAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={uploadData.isFeatured}
                  onChange={(e) => setUploadData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                  className="h-4 w-4 text-pt-turquoise focus:ring-pt-turquoise border-gray-300 rounded"
                />
                <label className="text-sm font-medium text-gray-700">Featured Resource</label>
                <span className="text-xs text-gray-500">(Will appear prominently in agent dashboard)</span>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false)
                    setError(null)
                    // Reset form data when canceling
                    setUploadData({
                      title: '',
                      description: '',
                      type: 'document',
                      category: 'training',
                      visibility: 'public',
                      isFeatured: false,
                      tags: '',
                      expiresAt: '',
                      file: null
                    })
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-pt-turquoise text-white px-6 py-2 rounded-lg hover:bg-pt-turquoise-600 disabled:bg-pt-turquoise/50 transition-colors"
                >
                  {saving ? 'Uploading...' : 'Upload Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
