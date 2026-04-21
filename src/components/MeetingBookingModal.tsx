'use client'

import { useState } from 'react'

interface MeetingBookingModalProps {
  isOpen: boolean
  onClose: () => void
  bookingUrl: string
}

const MeetingBookingModal = ({ isOpen, onClose, bookingUrl }: MeetingBookingModalProps) => {
  const [iframeLoaded, setIframeLoaded] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-white safe-area-inset">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-pt-turquoise/10 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-pt-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">Schedule Onboarding Meeting</h2>
            <p className="text-xs text-gray-500 hidden sm:block">Pick a time that works for you</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Iframe body */}
      <div className="flex-1 relative bg-gray-50">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pt-turquoise mb-4"></div>
            <p className="text-sm text-gray-500">Loading booking calendar&hellip;</p>
          </div>
        )}
        <iframe
          src={bookingUrl}
          className="w-full h-full border-0"
          title="Schedule a meeting"
          onLoad={() => setIframeLoaded(true)}
          allow="camera; microphone"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-200 bg-white flex-shrink-0">
        <p className="text-xs text-gray-400 hidden sm:block">Powered by Google Calendar</p>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-pt-turquoise hover:text-pt-turquoise-600 font-medium transition-colors hidden sm:inline-flex items-center gap-1"
          >
            Open in new tab
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default MeetingBookingModal
