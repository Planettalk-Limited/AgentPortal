'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function BulkUploadRedirect() {
  useEffect(() => {
    redirect('/admin/earnings')
  }, [])

  return null
}