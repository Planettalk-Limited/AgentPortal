'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

// Add custom CSS for animations
const fadeInStyle = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.6s ease-out;
  }
`

interface AgentApplication {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  dateOfBirth: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  experience: string
  motivation: string
  hasLicense: boolean
  licenseNumber?: string
  status: 'submitted' | 'under_review' | 'approved' | 'rejected'
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
  adminNotes?: string
}

export default function AgentApplicationsPage() {
  const [applications, setApplications] = useState<AgentApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 20
  })
  const [selectedApplication, setSelectedApplication] = useState<AgentApplication | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | ''>('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    under_review: 0,
    approved: 0,
    rejected: 0
  })

  useEffect(() => {
    loadApplications()
  }, [filters])

  const loadApplications = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.agent.getApplications(filters)

      // Handle different response structures
      let applicationsData = []
      if (Array.isArray(response)) {
        applicationsData = response
      } else if (response && typeof response === 'object') {
        applicationsData = (response as any).applications || response.data || []
      }

      setApplications(Array.isArray(applicationsData) ? applicationsData : [])

      // Calculate stats
      const totalApps = applicationsData.length
      const submitted = applicationsData.filter((app: AgentApplication) => app.status === 'submitted').length
      const under_review = applicationsData.filter((app: AgentApplication) => app.status === 'under_review').length
      const approved = applicationsData.filter((app: AgentApplication) => app.status === 'approved').length
      const rejected = applicationsData.filter((app: AgentApplication) => app.status === 'rejected').length

      setStats({
        total: totalApps,
        submitted,
        under_review,
        approved,
        rejected
      })

    } catch (error) {
      // Failed to load applications
      setError('Failed to load applications')
      
      // Set mock data for development
      const mockApplications: AgentApplication[] = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phoneNumber: '+1-555-0123',
          dateOfBirth: '1990-05-15',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'United States',
          experience: 'I have 5 years of experience in telecommunications and customer service. Previously worked at Verizon as a customer support representative.',
          motivation: 'I want to join PlanetTalk because I believe in providing affordable communication solutions to people worldwide.',
          hasLicense: true,
          licenseNumber: 'TEL-123456',
          status: 'submitted',
          submittedAt: new Date().toISOString()
        },
        {
          id: '2',
          firstName: 'Sarah',
          lastName: 'Wilson',
          email: 'sarah.wilson@example.com',
          phoneNumber: '+1-555-0456',
          dateOfBirth: '1988-03-22',
          address: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'United States',
          experience: 'Sales background with 3 years in retail and 2 years in direct sales.',
          motivation: 'Looking for a flexible opportunity to earn income while helping customers.',
          hasLicense: false,
          status: 'under_review',
          submittedAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]
      
      setApplications(mockApplications)
      setStats({
        total: 2,
        submitted: 1,
        under_review: 1,
        approved: 0,
        rejected: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReviewApplication = async () => {
    try {
      if (!selectedApplication || !reviewAction) return

      const reviewData = {
        status: (reviewAction === 'approve' ? 'approved' : 'rejected') as 'approved' | 'rejected',
        rejectionReason: reviewAction === 'reject' ? rejectionReason : undefined,
        reviewNotes: adminNotes
      }

      if (reviewAction === 'approve') {
        // First approve the agent
        await api.agent.approveAgent(selectedApplication.id)
        
        // Then send credentials
        await api.agent.sendCredentials(selectedApplication.id)
      } else {
        // Review the application
        await api.agent.reviewApplication(selectedApplication.id, reviewData)
      }

      setShowReviewModal(false)
      setSelectedApplication(null)
      setReviewAction('')
      setRejectionReason('')
      setAdminNotes('')
      loadApplications() // Reload data
    } catch (error) {
      // Failed to review application
      setError('Failed to review application')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800'
      case 'under_review': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-pt-turquoise border-t-transparent absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Loading Applications</p>
          <p className="mt-2 text-sm text-gray-500">Fetching agent application data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 17.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Applications Unavailable</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={loadApplications}
            className="bg-pt-turquoise text-white px-6 py-3 rounded-lg hover:bg-pt-turquoise-600 transition-colors duration-200 flex items-center space-x-2 mx-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Try Again</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{fadeInStyle}</style>
      <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">Agent Applications</h1>
            <p className="text-purple-100 text-lg">Review and approve new agent applications</p>
            <div className="flex items-center mt-4 space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>System Online</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{stats.total} total applications</span>
              </div>
            </div>
          </div>
          <button
            onClick={loadApplications}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white px-6 py-3 rounded-xl transition-all duration-200 flex items-center space-x-2 hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Total Applications */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Total</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500 mt-1">All applications</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Submitted */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Submitted</p>
              <p className="text-3xl font-bold text-blue-600">{stats.submitted}</p>
              <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Under Review */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Under Review</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.under_review}</p>
              <p className="text-xs text-gray-500 mt-1">Being processed</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Approved</p>
              <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              <p className="text-xs text-gray-500 mt-1">Ready to onboard</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Rejected */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Rejected</p>
              <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
              <p className="text-xs text-gray-500 mt-1">Not approved</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filter Applications</h3>
          <span className="text-sm text-gray-500">{applications.length} results</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Application Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pt-turquoise focus:border-transparent bg-white shadow-sm hover:border-gray-400 transition-colors duration-200"
            >
              <option value="">🔍 All Statuses</option>
              <option value="submitted">📝 Submitted</option>
              <option value="under_review">👀 Under Review</option>
              <option value="approved">✅ Approved</option>
              <option value="rejected">❌ Rejected</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', page: 1, limit: 20 })}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl transition-colors duration-200 text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">Applications List</h3>
          <p className="text-sm text-gray-500 mt-1">Review and manage all agent applications</p>
        </div>
        {applications.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-pt-turquoise/10 rounded-full flex items-center justify-center">
                          <span className="text-pt-turquoise font-semibold">
                            {application.firstName.charAt(0)}{application.lastName.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {application.firstName} {application.lastName}
                          </div>
                          {application.hasLicense && (
                            <div className="text-xs text-green-600">Licensed</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{application.email}</div>
                      <div className="text-sm text-gray-500">{application.phoneNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{application.city}, {application.state}</div>
                      <div className="text-sm text-gray-500">{application.country}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                        {formatStatus(application.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(application.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedApplication(application)
                            setShowReviewModal(true)
                          }}
                          className="text-pt-turquoise hover:text-pt-turquoise-600"
                        >
                          Review
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications</h3>
            <p className="text-gray-500">No agent applications found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Review Application - {selectedApplication.firstName} {selectedApplication.lastName}
                </h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Application Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Personal Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedApplication.firstName} {selectedApplication.lastName}</div>
                    <div><span className="font-medium">Email:</span> {selectedApplication.email}</div>
                    <div><span className="font-medium">Phone:</span> {selectedApplication.phoneNumber}</div>
                    <div><span className="font-medium">Date of Birth:</span> {selectedApplication.dateOfBirth}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Address</h4>
                  <div className="space-y-2 text-sm">
                    <div>{selectedApplication.address}</div>
                    <div>{selectedApplication.city}, {selectedApplication.state} {selectedApplication.zipCode}</div>
                    <div>{selectedApplication.country}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Experience</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedApplication.experience}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Motivation</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedApplication.motivation}</p>
              </div>

              {selectedApplication.hasLicense && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">License Information</h4>
                  <p className="text-sm text-gray-700">License Number: {selectedApplication.licenseNumber}</p>
                </div>
              )}

              {/* Review Actions */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Review Decision</h4>
                
                <div className="flex space-x-4 mb-4">
                  <button
                    onClick={() => setReviewAction('approve')}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      reviewAction === 'approve' 
                        ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => setReviewAction('reject')}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      reviewAction === 'reject' 
                        ? 'bg-red-100 text-red-800 border-2 border-red-300' 
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    Reject
                  </button>
                </div>

                {reviewAction === 'reject' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise"
                      rows={3}
                      placeholder="Please provide a reason for rejection..."
                      required
                    />
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pt-turquoise focus:border-pt-turquoise"
                    rows={2}
                    placeholder="Internal notes about this application..."
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleReviewApplication}
                    disabled={!reviewAction || (reviewAction === 'reject' && !rejectionReason)}
                    className="bg-pt-turquoise text-white px-6 py-2 rounded-lg font-medium hover:bg-pt-turquoise-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit Review
                  </button>
                  <button
                    onClick={() => setShowReviewModal(false)}
                    className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}
      </div>
    </>
  )
}
