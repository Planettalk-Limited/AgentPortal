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

interface PreviewModal {
  isOpen: boolean;
  resource: Resource | null;
  type: 'pdf' | 'image' | 'video' | 'document' | null;
}

export default function MediaPage() {
  const [mediaData, setMediaData] = useState<MediaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [previewModal, setPreviewModal] = useState<PreviewModal>({
    isOpen: false,
    resource: null,
    type: null
  })

  const t = useTranslations('media')
  const locale = useLocale()

  // Static Terms & Conditions PDF
  const staticTermsPDF: any = {
    id: 'static-terms-pdf',
    title: 'Agent Program Terms & Conditions',
    description: 'Official terms and conditions for the PlanetTalk Agent Program',
    fileName: 'terms-and-conditions.pdf',
    originalName: 'terms-and-conditions.pdf',
    fileSize: 0,
    mimeType: 'application/pdf',
    type: 'document',
    category: 'other',
    visibility: 'public',
    isFeatured: true,
    isExternal: false,
    isEmbedded: false,
    viewCount: 0,
    downloadCount: 0,
    tags: ['terms', 'conditions', 'agent program', 'official'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }

  // Static YouTube Training Videos
  const trainingVideos: any[] = [
    {
      id: 'video-top-up-credit',
      title: 'How to top up your PlanetTalk calling credit',
      description: 'Learn how to easily add credit to your PlanetTalk account for international calls',
      fileSize: 0,
      mimeType: 'video/youtube',
      type: 'video',
      category: 'training',
      visibility: 'public',
      isFeatured: false,
      isExternal: true,
      isEmbedded: true,
      externalUrl: 'https://youtube.com/shorts/zwiWrohtXAg',
      embedUrl: 'https://www.youtube.com/embed/zwiWrohtXAg',
      viewCount: 0,
      downloadCount: 0,
      tags: ['tutorial', 'top-up', 'credit', 'calling'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'video-airtime-data',
      title: 'How to Send Airtime and Data credit',
      description: 'Send mobile airtime and data credit to loved ones across the world with PlanetTalk',
      fileSize: 0,
      mimeType: 'video/youtube',
      type: 'video',
      category: 'training',
      visibility: 'public',
      isFeatured: false,
      isExternal: true,
      isEmbedded: true,
      externalUrl: 'https://youtube.com/shorts/v_IZ33bLLMk',
      embedUrl: 'https://www.youtube.com/embed/v_IZ33bLLMk',
      viewCount: 0,
      downloadCount: 0,
      tags: ['tutorial', 'airtime', 'data', 'mobile'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'video-utility-bills',
      title: 'Pay Utility Bills in few easy steps',
      description: 'Learn how to pay utility bills for loved ones using the PlanetTalk app',
      fileSize: 0,
      mimeType: 'video/youtube',
      type: 'video',
      category: 'training',
      visibility: 'public',
      isFeatured: false,
      isExternal: true,
      isEmbedded: true,
      externalUrl: 'https://youtube.com/shorts/kqRChnL7jhY',
      embedUrl: 'https://www.youtube.com/embed/kqRChnL7jhY',
      viewCount: 0,
      downloadCount: 0,
      tags: ['tutorial', 'utility', 'bills', 'payments'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'video-app-overview',
      title: 'PlanetTalk App Overview',
      description: 'Pay bills, send top-up and data, and make low cost international calls with PlanetTalk',
      fileSize: 0,
      mimeType: 'video/youtube',
      type: 'video',
      category: 'training',
      visibility: 'public',
      isFeatured: false,
      isExternal: true,
      isEmbedded: true,
      externalUrl: 'https://youtube.com/shorts/CRo9arhTob4',
      embedUrl: 'https://www.youtube.com/embed/CRo9arhTob4',
      viewCount: 0,
      downloadCount: 0,
      tags: ['overview', 'features', 'app'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'video-add-payment-card',
      title: 'How to Add Payment Card',
      description: 'Step-by-step guide to adding your payment card on the PlanetTalk app',
      fileSize: 0,
      mimeType: 'video/youtube',
      type: 'video',
      category: 'training',
      visibility: 'public',
      isFeatured: false,
      isExternal: true,
      isEmbedded: true,
      externalUrl: 'https://youtube.com/shorts/xUrT6Zq2W90',
      embedUrl: 'https://www.youtube.com/embed/xUrT6Zq2W90',
      viewCount: 0,
      downloadCount: 0,
      tags: ['tutorial', 'payment', 'card', 'setup'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'video-auto-topup',
      title: 'Enable and Disable Auto Top-up',
      description: 'Learn how to manage auto top-up settings on the PlanetTalk App',
      fileSize: 0,
      mimeType: 'video/youtube',
      type: 'video',
      category: 'training',
      visibility: 'public',
      isFeatured: false,
      isExternal: true,
      isEmbedded: true,
      externalUrl: 'https://youtube.com/shorts/OhhqjXuKsh0',
      embedUrl: 'https://www.youtube.com/embed/OhhqjXuKsh0',
      viewCount: 0,
      downloadCount: 0,
      tags: ['tutorial', 'auto-topup', 'settings'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'video-call-rates',
      title: 'Check Destination Call Rates',
      description: 'Find out how to check international calling rates on the PlanetTalk App',
      fileSize: 0,
      mimeType: 'video/youtube',
      type: 'video',
      category: 'training',
      visibility: 'public',
      isFeatured: false,
      isExternal: true,
      isEmbedded: true,
      externalUrl: 'https://youtube.com/shorts/dNF2nidlSpk',
      embedUrl: 'https://www.youtube.com/embed/dNF2nidlSpk',
      viewCount: 0,
      downloadCount: 0,
      tags: ['tutorial', 'rates', 'calling', 'pricing'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'video-marketing-messages',
      title: 'Manage Marketing Messages',
      description: 'Learn how to opt in and opt out of marketing messages on PlanetTalk app',
      fileSize: 0,
      mimeType: 'video/youtube',
      type: 'video',
      category: 'training',
      visibility: 'public',
      isFeatured: false,
      isExternal: true,
      isEmbedded: true,
      externalUrl: 'https://youtube.com/shorts/rxz0xifMvjo',
      embedUrl: 'https://www.youtube.com/embed/rxz0xifMvjo',
      viewCount: 0,
      downloadCount: 0,
      tags: ['tutorial', 'marketing', 'settings', 'preferences'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  useEffect(() => {
    loadMediaData()
  }, [])

  const loadMediaData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await api.agent.getAgentMedia()
      
      if (data) {
        // Add static terms PDF to termsAndConditions
        data.termsAndConditions = [staticTermsPDF, ...(data.termsAndConditions || [])]
        // Add YouTube training videos to trainingMaterials
        data.trainingMaterials = [...trainingVideos, ...(data.trainingMaterials || [])]
        setMediaData(data)
      } else {
        setError('No media data available')
        return
      }
      
    } catch (error: any) {
      setError(error.message || error.error || 'Failed to load media resources')
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async (resource: Resource) => {
    // For static terms PDF
    if (resource.id === 'static-terms-pdf') {
      setPreviewModal({
        isOpen: true,
        resource: resource,
        type: 'pdf'
      })
      return
    }

    // For YouTube videos (static training videos)
    if (resource.mimeType === 'video/youtube' && resource.isEmbedded) {
      setPreviewModal({
        isOpen: true,
        resource: resource,
        type: 'video'
      })
      return
    }

    // Track access
    try {
      await api.agent.trackResourceAccess(resource.id)
    } catch (trackError) {
      // Don't fail the whole operation if tracking fails
    }
      
    // Determine preview type
    let previewType: 'pdf' | 'image' | 'video' | 'document' | null = null
    
    if (resource.mimeType?.includes('pdf')) {
      previewType = 'pdf'
    } else if (resource.mimeType?.startsWith('image/')) {
      previewType = 'image'
    } else if (resource.mimeType?.startsWith('video/')) {
      previewType = 'video'
    } else if (resource.isEmbedded) {
      previewType = 'document'
    }

    // Handle external resources (non-embedded)
    if (resource.isExternal && !resource.isEmbedded) {
      window.open(resource.externalUrl, '_blank')
      return
    }

    // For preview-able resources, show modal immediately and fetch content
    if (previewType) {
      // Show modal with loading state
      setPreviewModal({
        isOpen: true,
        resource: resource,
        type: previewType
      })

      try {
        // Fetch the resource content URL from API
        const content = await api.agent.getResourceContent(resource.id)
        
        if (content.url) {
          // Update the modal with the fetched URL
          const resourceWithUrl = { ...resource, contentUrl: content.url }
          setPreviewModal({
            isOpen: true,
            resource: resourceWithUrl,
            type: previewType
          })
        } else {
          // If no URL, close modal and fallback to download
          setPreviewModal({ isOpen: false, resource: null, type: null })
          handleDownload(resource)
        }
      } catch (error: any) {
        // Close modal and show error
        setPreviewModal({ isOpen: false, resource: null, type: null })
        setError(`Failed to load preview for ${resource.title}: ${error.message || 'Unknown error'}`)
        setTimeout(() => setError(null), 5000)
      }
    } else {
      // Fallback to download
      handleDownload(resource)
    }
  }

  const handleDownload = async (resource: Resource) => {
    // For static terms PDF
    if (resource.id === 'static-terms-pdf') {
      const link = document.createElement('a')
      link.href = '/terms-and-conditions.pdf'
      link.download = 'terms-and-conditions.pdf'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return
    }

    // For YouTube videos, open in new tab
    if (resource.mimeType === 'video/youtube' && resource.externalUrl) {
      window.open(resource.externalUrl, '_blank')
      return
    }

    try {
      const content = await api.agent.getResourceContent(resource.id)

      if (content.url) {
        const link = document.createElement('a')
        link.href = content.url
        link.download = content.fileName || resource.originalName || resource.fileName || 'download'
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error: any) {
      setError(`Failed to download ${resource.title}: ${error.message || 'Unknown error'}`)
      setTimeout(() => setError(null), 5000)
    }
  }

  const getAllResources = (): Resource[] => {
    if (!mediaData) return []
    
    return [
      ...mediaData.trainingMaterials,
      ...mediaData.bankForms,
      ...mediaData.termsAndConditions,
      ...mediaData.compliance,
      ...mediaData.marketing,
      ...mediaData.announcements,
      ...mediaData.media
    ]
  }

  const getFilteredResources = () => {
    if (!mediaData) return []
    
    let resources: Resource[] = []
    
    if (selectedCategory === 'all') {
      resources = getAllResources()
    } else {
      switch (selectedCategory) {
        case 'training':
          resources = mediaData.trainingMaterials || []
          break
        case 'bank_forms':
          resources = mediaData.bankForms || []
          break
        case 'terms_conditions':
          resources = mediaData.termsAndConditions || []
          break
        case 'compliance':
          resources = mediaData.compliance || []
          break
        case 'marketing':
          resources = mediaData.marketing || []
          break
        case 'announcements':
          resources = mediaData.announcements || []
          break
        case 'media':
          resources = mediaData.media || []
          break
      }
    }

    return resources
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getResourceUrl = (resource: any) => {
    if (resource.id === 'static-terms-pdf') {
      return '/terms-and-conditions.pdf'
    }
    // For YouTube videos, use embedUrl
    if (resource.mimeType === 'video/youtube' && resource.embedUrl) {
      return resource.embedUrl
    }
    // For API resources, the URL is already fetched and stored in contentUrl
    return resource.contentUrl || null
  }

  const PreviewModalComponent = () => {
    if (!previewModal.isOpen || !previewModal.resource) return null

    const resource = previewModal.resource
    const resourceUrl = getResourceUrl(resource)

    // Close modal on ESC key
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setPreviewModal({ isOpen: false, resource: null, type: null })
        }
      }
      
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [])

    return (
      <div 
        className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-0 sm:p-4"
        onClick={(e) => {
          // Close modal when clicking backdrop (not the content)
          if (e.target === e.currentTarget) {
            setPreviewModal({ isOpen: false, resource: null, type: null })
          }
        }}
      >
        <div className="relative bg-white w-full h-full sm:rounded-xl shadow-2xl sm:w-[98vw] sm:h-[98vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 flex-shrink-0 bg-white sm:rounded-t-xl">
            <div className="flex-1 min-w-0 pr-2 sm:pr-4">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 truncate">{resource.title}</h2>
              <p className="text-gray-600 mt-0.5 line-clamp-1 text-xs sm:text-sm">{resource.description}</p>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {resource.mimeType === 'video/youtube' ? (
                <button
                  onClick={() => handleDownload(resource)}
                  className="flex items-center gap-2 px-3 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm font-medium"
                  title="Watch on YouTube"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span className="hidden sm:inline">YouTube</span>
                </button>
              ) : (
                <button
                  onClick={() => handleDownload(resource)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Download"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setPreviewModal({ isOpen: false, resource: null, type: null })}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden bg-gray-50">
            {!resourceUrl ? (
              <div className="flex items-center justify-center h-full p-4">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pt-turquoise mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading preview...</p>
                </div>
              </div>
            ) : previewModal.type === 'pdf' ? (
              <div className="h-full w-full">
                <iframe
                  src={resourceUrl}
                  className="w-full h-full border-0"
                  title={resource.title}
                />
              </div>
            ) : previewModal.type === 'image' ? (
              <div className="flex items-center justify-center h-full p-4">
                <img src={resourceUrl} alt={resource.title} className="max-w-full max-h-full object-contain" />
              </div>
            ) : previewModal.type === 'video' ? (
              resource.mimeType === 'video/youtube' ? (
                // YouTube embed
                <div className="h-full w-full flex items-center justify-center bg-black p-4">
                  <div className="w-full max-w-4xl aspect-video">
                    <iframe
                      src={resourceUrl}
                      className="w-full h-full border-0 rounded-lg"
                      title={resource.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : (
                // Regular video file
                <div className="flex items-center justify-center h-full p-4 bg-black">
                  <video controls className="max-w-full max-h-full" autoPlay>
                    <source src={resourceUrl} type={resource.mimeType} />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )
            ) : null}
          </div>
        </div>
      </div>
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

  const displayResources = getFilteredResources()
  const categories = [
    { key: 'all', label: t('categories.all'), icon: '📁', count: getAllResources().length },
    { key: 'training', label: t('categories.training'), icon: '📚', count: mediaData?.trainingMaterials.length || 0 },
    { key: 'terms_conditions', label: t('categories.termsConditions'), icon: '📋', count: mediaData?.termsAndConditions.length || 0 },
    { key: 'bank_forms', label: t('categories.bankForms'), icon: '🏦', count: mediaData?.bankForms.length || 0 },
    { key: 'announcements', label: t('categories.announcements'), icon: '📢', count: mediaData?.announcements.length || 0 },
    { key: 'marketing', label: t('categories.marketing'), icon: '📈', count: mediaData?.marketing.length || 0 },
    { key: 'compliance', label: t('categories.compliance'), icon: '✅', count: mediaData?.compliance.length || 0 },
    { key: 'media', label: t('categories.media'), icon: '🎬', count: mediaData?.media.length || 0 }
  ]

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      {/* Compact Header */}
      <div className="mb-3 w-full max-w-full">
        {/* Title Bar */}
        <div className="flex items-center mb-4 w-full">
          <div className="w-10 h-10 bg-gradient-to-r from-pt-turquoise to-pt-turquoise-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2a2 2 0 002 2m0 0h14" />
            </svg>
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{t('title')}</h1>
            <p className="text-gray-600 text-sm truncate">{t('subtitle')}</p>
        </div>
      </div>

        {/* Category Tabs */}
        <div className="relative w-full mb-4 overflow-x-hidden">
          <div className="overflow-x-auto scrollbar-thin pb-2">
            <div className="flex gap-2 min-w-0">
              {categories.map((category) => (
                  <button
                    key={category.key}
                    onClick={() => setSelectedCategory(category.key)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                      selectedCategory === category.key
                      ? 'bg-pt-turquoise text-white shadow-md'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-pt-turquoise'
                  }`}
                >
                  <span className="text-base">{category.icon}</span>
                  <span className="whitespace-nowrap">{category.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    selectedCategory === category.key
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                          {category.count}
                        </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
        </div>

        {/* Error Message */}
        {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-3 flex items-center text-sm w-full max-w-full">
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          <span className="flex-1 truncate min-w-0">{error}</span>
          <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

      {/* Resources Grid */}
      <div className="w-full max-w-full overflow-x-hidden">
        {displayResources.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2a2 2 0 002 2m0 0h14" />
              </svg>
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-2">No Resources Found</h3>
            <p className="text-sm text-gray-500">Try selecting a different category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pb-6 w-full max-w-full">
            {displayResources.map((resource) => (
              <div key={resource.id} className="bg-white rounded-xl border border-gray-200 hover:border-pt-turquoise shadow-sm hover:shadow-lg transition-all duration-200 w-full min-w-0 overflow-hidden group">
                {/* Thumbnail/Icon */}
                <div className="h-32 bg-gradient-to-br from-pt-turquoise/10 via-pt-turquoise/5 to-transparent flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-pt-turquoise/5 group-hover:to-pt-turquoise/10 transition-all duration-200"></div>
                  <svg className="w-12 h-12 text-pt-turquoise opacity-60 relative z-10 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {resource.mimeType?.includes('pdf') || resource.id === 'static-terms-pdf' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    ) : resource.mimeType?.startsWith('image/') ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    ) : resource.mimeType?.startsWith('video/') ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    )}
                  </svg>
                </div>

                {/* Content */}
                <div className="p-4 w-full min-w-0">
                  <h3 className="font-bold text-base text-gray-900 mb-2 truncate group-hover:text-pt-turquoise transition-colors w-full">
                              {resource.title}
                            </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2 break-words leading-relaxed w-full overflow-hidden">
                    {resource.description}
                  </p>
                            
                  {/* Meta Info */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-4 pb-3 border-b border-gray-100">
                              <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                      <span className="font-medium">{resource.viewCount || 0}</span>
                              </span>
                    {resource.fileSize > 0 && (
                                <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                  <span className="font-medium">{formatFileSize(resource.fileSize)}</span>
                                </span>
                              )}
                            </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePreview(resource)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-pt-turquoise text-white rounded-lg hover:bg-pt-turquoise-600 text-sm font-semibold transition-colors shadow-sm hover:shadow"
                    >
                      {resource.mimeType === 'video/youtube' ? (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                          Watch
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </>
                      )}
                    </button>
                    {resource.mimeType !== 'video/youtube' && (
                      <button
                        onClick={() => handleDownload(resource)}
                        className="p-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        title="Download"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    )}
                  </div>
                        </div>
                  </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Preview Modal */}
      <PreviewModalComponent />
      
      <style jsx>{`
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
        }
        .scrollbar-thin::-webkit-scrollbar {
          height: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.7);
        }
      `}</style>
    </div>
  )
}
