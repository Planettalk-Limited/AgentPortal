'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { api, Resource } from '@/lib/api'

interface MediaData {
  trainingMaterials: Resource[];
  bankForms: Resource[];
  termsAndConditions: Resource[];
  compliance: Resource[];
  marketing: Resource[];
  policies: Resource[];
  guides: Resource[];
  templates: Resource[];
  media: Resource[];
  announcements: Resource[];
  other: Resource[];
  summary: {
    totalResources: number;
    newThisMonth: number;
    featuredCount: number;
  };
}

export default function MediaPage() {
  const [mediaData, setMediaData] = useState<MediaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('training')
  const [categoryResources, setCategoryResources] = useState<Resource[]>([])
  const [categoryLoading, setCategoryLoading] = useState(false)

  const t = useTranslations('media')
  const locale = useLocale()

  useEffect(() => {
    loadMediaData()
  }, [])

  useEffect(() => {
    if (selectedCategory !== 'featured' && selectedCategory !== 'recent') {
      loadCategoryResources(selectedCategory)
    }
  }, [selectedCategory])

  const loadMediaData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await api.agent.getAgentMedia()
      
      if (data) {
        setMediaData(data)
      } else {
        setError('No media data available')
        return
      }
      
      // Auto-select the first category that has content
      if (data) {
        const categoriesWithContent = [
          { key: 'training', count: data.trainingMaterials?.length || 0 },
          { key: 'announcements', count: data.announcements?.length || 0 },
          { key: 'bank_forms', count: data.bankForms?.length || 0 },
          { key: 'terms_conditions', count: data.termsAndConditions?.length || 0 },
          { key: 'compliance', count: data.compliance?.length || 0 },
          { key: 'marketing', count: data.marketing?.length || 0 },
          { key: 'media', count: data.media?.length || 0 }
        ].filter(cat => cat.count > 0)
        
        if (categoriesWithContent.length > 0) {
          setSelectedCategory(categoriesWithContent[0].key)
        } else if (data.summary.featuredCount > 0) {
          setSelectedCategory('featured')
        }
      }
      
    } catch (error: any) {
      setError(error.message || error.error || 'Failed to load media resources')
    } finally {
      setLoading(false)
    }
  }

  const loadCategoryResources = async (category: string) => {
    try {
      setCategoryLoading(true)
      const response = await api.agent.getMediaByCategory(category, { limit: 50 })
      setCategoryResources(response.resources || [])
    } catch (error: any) {
      setCategoryResources([])
    } finally {
      setCategoryLoading(false)
    }
  }

  const handleResourceAccess = async (resource: Resource) => {
    try {
      // Track access for compliance
      try {
        await api.agent.trackResourceAccess(resource.id)
      } catch (trackError) {
        // Don't fail the whole operation if tracking fails
      }
      
      // Get content based on type
      const content = await api.agent.getResourceContent(resource.id)

      if (content.type === 'embedded') {
        // Show embedded content in modal
        showEmbeddedContent(resource, content.content || '')
      } else if (content.type === 'external') {
        // Open external link in new tab
        window.open(content.url, '_blank')
      } else if (content.type === 'file') {
        if (!content.url) {
          throw new Error('No download URL provided by server')
        }
        
        // Use the URL from content response directly since it's already a download URL
        const link = document.createElement('a')
        link.href = content.url
        link.download = content.fileName || resource.originalName || resource.fileName || 'download'
        link.target = '_blank'
        
        // Add to DOM, click, and remove
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        setError(`Unknown content type: ${content.type}`)
      }
    } catch (error: any) {
      setError(`Failed to access ${resource.title}: ${error.message || 'Unknown error'}`)
      setTimeout(() => setError(null), 5000)
    }
  }

  const showEmbeddedContent = (resource: Resource, content: string) => {
    // Create a modal or navigate to a content view page
    // For now, we'll open in a new window
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>${resource.title}</title>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
              h1 { color: #24B6C3; }
            </style>
          </head>
          <body>
            <h1>${resource.title}</h1>
            <p><em>${resource.description}</em></p>
            <hr>
            ${content}
          </body>
        </html>
      `)
      newWindow.document.close()
    }
  }

  const getFileIcon = (resource: Resource) => {
    if (resource.isExternal) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      )
    }
    if (resource.isEmbedded) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
    
    // File type icons
    if (resource.mimeType?.startsWith('image/')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    }
    if (resource.mimeType?.startsWith('video/')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
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

  const getCategoryResources = () => {
    if (!mediaData) return []
    
    switch (selectedCategory) {
      case 'featured':
        // Get featured resources from all categories
        const featuredResources = [
          ...mediaData.trainingMaterials.filter(r => r.isFeatured),
          ...mediaData.bankForms.filter(r => r.isFeatured),
          ...mediaData.termsAndConditions.filter(r => r.isFeatured),
          ...mediaData.compliance.filter(r => r.isFeatured),
          ...mediaData.marketing.filter(r => r.isFeatured),
          ...mediaData.announcements.filter(r => r.isFeatured),
          ...mediaData.media.filter(r => r.isFeatured)
        ]
        return featuredResources
      case 'training':
        return mediaData.trainingMaterials || []
      case 'bank_forms':
        return mediaData.bankForms || []
      case 'terms_conditions':
        return mediaData.termsAndConditions || []
      case 'compliance':
        return mediaData.compliance || []
      case 'marketing':
        return mediaData.marketing || []
      case 'announcements':
        return mediaData.announcements || []
      case 'media':
        return mediaData.media || []
      default:
        return categoryResources
    }
  }

  const getActionText = (resource: Resource) => {
    if (resource.isExternal) return t('actions.openLink')
    if (resource.isEmbedded) return t('actions.viewContent')
    return t('actions.download')
  }

  const getActionIcon = (resource: Resource) => {
    if (resource.isExternal) {
      return (
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      )
    }
    if (resource.isEmbedded) {
      return (
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
    return (
      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      </svg>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pt-turquoise mx-auto mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('error.title')}</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadMediaData}
            className="bg-pt-turquoise text-white px-4 py-2 rounded-lg hover:bg-pt-turquoise-600 transition-colors"
          >
            {t('error.retry')}
          </button>
        </div>
      </div>
    )
  }

  const displayResources = getCategoryResources()

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-pt-turquoise to-pt-turquoise-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2a2 2 0 002 2m0 0h14" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-gray-600">{t('subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {mediaData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2a2 2 0 002 2m0 0h14" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('summary.totalResources')}</p>
                  <p className="text-2xl font-bold text-gray-900">{mediaData.summary.totalResources}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('summary.newThisMonth')}</p>
                  <p className="text-2xl font-bold text-gray-900">{mediaData.summary.newThisMonth}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('summary.featured')}</p>
                  <p className="text-2xl font-bold text-gray-900">{mediaData.summary.featuredCount}</p>
                </div>
              </div>
            </div>
        </div>
      )}

      {/* Category Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto">
              {[
                { key: 'featured', label: t('categories.featured'), icon: '⭐', count: mediaData?.summary.featuredCount },
                { key: 'training', label: t('categories.training'), icon: '📚', count: mediaData?.trainingMaterials.length },
                { key: 'announcements', label: t('categories.announcements'), icon: '📢', count: mediaData?.announcements.length },
                { key: 'bank_forms', label: t('categories.bankForms'), icon: '🏦', count: mediaData?.bankForms.length },
                { key: 'terms_conditions', label: t('categories.termsConditions'), icon: '📋', count: mediaData?.termsAndConditions.length },
                { key: 'compliance', label: t('categories.compliance'), icon: '✅', count: mediaData?.compliance.length },
                { key: 'marketing', label: t('categories.marketing'), icon: '📈', count: mediaData?.marketing.length },
                { key: 'media', label: t('categories.media'), icon: '🎬', count: mediaData?.media.length }
              ]
              .sort((a, b) => {
                // Prioritize categories with content, then by count
                if ((a.count || 0) > 0 && (b.count || 0) === 0) return -1
                if ((a.count || 0) === 0 && (b.count || 0) > 0) return 1
                return (b.count || 0) - (a.count || 0)
              })
              .map((category) => (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`flex-shrink-0 px-6 py-4 border-b-2 font-medium text-sm transition-all duration-200 ${
                    selectedCategory === category.key
                      ? 'border-pt-turquoise text-pt-turquoise bg-pt-turquoise/5'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{category.icon}</span>
                    <span>{category.label}</span>
                    {category.count !== undefined && category.count > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {category.count}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Error Message */}
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

      {/* Resources Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
              {selectedCategory === 'featured' ? t('categories.featured') : 
               selectedCategory === 'training' ? t('categories.training') :
               selectedCategory === 'bank_forms' ? t('categories.bankForms') :
               selectedCategory === 'terms_conditions' ? t('categories.termsConditions') :
               selectedCategory === 'compliance' ? t('categories.compliance') :
               selectedCategory === 'marketing' ? t('categories.marketing') :
               selectedCategory === 'announcements' ? t('categories.announcements') :
               selectedCategory === 'media' ? t('categories.media') :
               t('categories.other')}
            </h2>
          </div>

          <div className="p-6">
            {categoryLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pt-turquoise mx-auto mb-4"></div>
                <p className="text-gray-600">{t('loadingCategory')}</p>
              </div>
            ) : displayResources.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2a2 2 0 002 2m0 0h14" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('empty.title')}</h3>
                <p className="text-gray-500">{t('empty.description')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayResources.map((resource) => (
                  <div key={resource.id} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-white rounded-lg shadow-sm text-gray-600">
                        {getFileIcon(resource)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {resource.title}
                              {resource.isFeatured && (
                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  ⭐ {t('featured')}
                                </span>
                              )}
                            </h3>
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{resource.description}</p>
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mb-4">
                              <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {resource.viewCount} {t('views')}
                              </span>
                              {resource.fileSize && (
                                <span className="flex items-center">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  {formatFileSize(resource.fileSize)}
                                </span>
                              )}
                              <span className="flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {new Date(resource.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <button
                              onClick={() => handleResourceAccess(resource)}
                              className="inline-flex items-center bg-pt-turquoise text-white px-4 py-2 rounded-lg hover:bg-pt-turquoise-600 transition-colors font-medium"
                            >
                              {getActionIcon(resource)}
                              {getActionText(resource)}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    {resource.tags && resource.tags.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex flex-wrap gap-2">
                          {resource.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pt-turquoise/10 text-pt-turquoise"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
