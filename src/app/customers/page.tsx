'use client'

import { useState, useEffect } from 'react'
import Layout from '@/app/components/layout/layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiClient, Customer, PaginatedResponse } from '@/lib/api-client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Eye, AlertTriangle, CheckCircle, Clock, XCircle, Plus } from 'lucide-react'
import CreateCustomerModal from '@/app/components/customers/create-customer-modal'
import { useRouter } from 'next/navigation'
import AtRiskCustomers from '../components/customers/at-risk-customer'

const statusIcons = {
  active: CheckCircle,
  trial: Clock,
  past_due: AlertTriangle,
  canceled: XCircle,
}

const statusColors = {
  active: 'text-green-600 bg-green-50',
  trial: 'text-yellow-600 bg-yellow-50',
  past_due: 'text-red-600 bg-red-50',
  canceled: 'text-gray-600 bg-gray-50',
}

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [atRiskCustomers, setAtRiskCustomers] = useState<Customer[]>([])

  useEffect(() => {
    fetchCustomers()
  }, [pagination.page, search])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getCustomers(pagination.page, pagination.limit, search)
      if (response.status === 'success') {
        setCustomers(response.data.customers || [])
        setPagination(response.data.pagination)
      } else {
        setError(response.message || 'Failed to fetch customers')
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleCreateCustomer = async (customerData: any) => {
    try {
      const response = await apiClient.createCustomer(customerData)
      if (response.status === 'success') {
        // Refresh the customer list
        await fetchCustomers()
        setShowCreateModal(false)
        return { success: true }
      } else {
        return { success: false, error: response.message }
      }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to create customer' }
    }
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600">Manage your customer base and subscriptions</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Customer
          </Button>
        </div>

        {/* At-Risk Customers Alert */}
        <AtRiskCustomers />

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search customers by name or email..."
                  value={search}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                Export Customers
              </Button>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Customers ({pagination.total})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchCustomers}>Try Again</Button>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No customers found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {customers.map((customer) => {
                  const StatusIcon = customer.subscription?.status ? 
                    statusIcons[customer.subscription.status as keyof typeof statusIcons] || CheckCircle : 
                    CheckCircle
                  const statusColor = customer.subscription?.status ? 
                    statusColors[customer.subscription.status as keyof typeof statusColors] || statusColors.active :
                    statusColors.active

                  return (
                    <div key={customer.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {customer.firstName?.charAt(0) || customer.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {customer.fullName}
                              </h3>
                              {customer.emailVerified && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                            <p className="text-sm text-gray-500 truncate">{customer.email}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-gray-500">
                                Joined: {formatDate(customer.createdAt)}
                              </span>
                              {customer.lastLoginAt && (
                                <span className="text-xs text-gray-500">
                                  Last login: {formatDate(customer.lastLoginAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            {customer.subscription ? (
                              <>
                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {customer.subscription.status}
                                </div>
                                <p className="text-sm text-gray-900 mt-1">
                                  {customer.subscription.planName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatCurrency(customer.subscription.price)}/{customer.subscription.billingCycle}
                                </p>
                              </>
                            ) : (
                              <span className="text-sm text-gray-500">No subscription</span>
                            )}
                          </div>

                          <div className="text-right">
                            <p className="text-sm text-gray-500">Groups</p>
                            <p className="text-lg font-medium">{customer.groupsCount}</p>
                          </div>

                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/customers/${customer.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} customers
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Customer Modal */}
        {showCreateModal && (
          <CreateCustomerModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleCreateCustomer}
          />
        )}
      </div>
    </Layout>
  )
}