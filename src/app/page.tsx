import { redirect } from 'next/navigation'

// This page only renders when the locale is missing from the URL
export default function RootPage() {
  // Redirect to default locale
  redirect('/en')
}
