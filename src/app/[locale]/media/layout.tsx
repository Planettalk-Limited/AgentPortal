import AuthenticatedLayout from '@/components/AuthenticatedLayout'

export default function MediaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthenticatedLayout>
      {children}
    </AuthenticatedLayout>
  )
}
