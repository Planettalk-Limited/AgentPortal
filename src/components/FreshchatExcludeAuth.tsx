'use client'

import { usePathname } from 'next/navigation'
import FreshchatWidget from './FreshchatWidget'

export default function FreshchatExcludeAuth() {
  const pathname = usePathname()
  const isAuthPage = pathname.includes('/auth/')

  if (isAuthPage) return null

  return <FreshchatWidget />
}
