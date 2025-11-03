'use client'

import { useEffect } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    fcWidget: any;
    FreshworksWidget: any;
    fwSettings: any;
  }
}

export default function FreshchatWidget() {
  useEffect(() => {
    // Set up Freshworks settings
    if (typeof window !== 'undefined') {
      window.fwSettings = {
        'widget_id': 36000001447
      }
      
      // Initialize the FreshworksWidget function if it doesn't exist
      if (typeof window.FreshworksWidget !== 'function') {
        const n = function(...args: any[]) {
          // @ts-expect-error - Freshworks queue initialization
          n.q.push(args)
        }
        // @ts-expect-error - Freshworks queue property
        n.q = []
        window.FreshworksWidget = n
      }
    }
  }, [])

  return (
    <>
      {/* Freshchat initialization script */}
      <Script
        id="freshchat-settings"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.fwSettings = {
              'widget_id': 36000001447
            };
            if (typeof window.FreshworksWidget !== 'function') {
              var n = function() { n.q.push(Array.prototype.slice.call(arguments)) };
              n.q = [];
              window.FreshworksWidget = n;
            }
          `
        }}
      />
      
      {/* Freshchat widget script */}
      <Script
        src="https://uae.fw-cdn.com/40130590/75360.js"
        strategy="lazyOnload"
        onLoad={() => {
          console.log('Freshchat script loaded successfully')
          
          // Initialize widget after script loads
          if (typeof window !== 'undefined' && window.FreshworksWidget) {
            try {
              window.FreshworksWidget('init', {
                widget_id: 36000001447,
                chat: true
              })
              console.log('Freshchat initialized successfully')
            } catch (error) {
              console.error('Error initializing Freshchat:', error)
            }
          }
        }}
        onError={() => {
          console.error('Failed to load Freshchat script - Access Denied or network error')
          // You might want to add a fallback contact method here
        }}
      />
    </>
  )
}

