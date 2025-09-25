import { ReactNode } from 'react'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'

interface AgentLayoutProps {
  children: ReactNode
}

export default function AgentLayout({ children }: AgentLayoutProps) {
  return (
    <AuthenticatedLayout>
      {children}
    </AuthenticatedLayout>
  )
}
