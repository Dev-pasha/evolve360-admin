'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiClient, CustomerDetails } from '@/lib/api-client'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  CreditCard, 
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Edit
} from 'lucide-react'
import Layout from '@/app/components/layout/layout'

const statusIcons = {
  active: CheckCircle,
  trial: Clock,
  past_due: AlertTriangle,
  canceled: XCircle,
}

const statusColors = {
  active: 'text-green-600 bg-green-50 border-green-200',
  trial: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  past_due: 'text-red-600 bg-red-50 border-red-200',
  canceled: 'text-gray-600 bg-gray-50 border-gray-200',
}

export default function CustomerDetailsPage() {
  const [customer, setCustomer] = useState<CustomerDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const customerId = params.id as string

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails()
    }
  }, [customerId])

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getCustomerDetails(parseInt(customerId))
      if (response.status === 'success') {
        setCustomer(response.data)
      } else {
        setError(response.message || 'Failed to fetch customer details')
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSubscriptionAction = async (action: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate', planId?: number) => {
    if (!customer) return
    
    alert('This Feature is Available Soon!')

    // try {
    //   setActionLoading(action)
    //   const response = await apiClient.updateCustomerSubscription(customer.id, action, planId)
      
    //   if (response.status === 'success') {
    //     // Refresh customer details
    //     await fetchCustomerDetails()
    //   } else {
    //     setError(response.message || `Failed to ${action} subscription`)
    //   }
    // } catch (error: any) {
    //   setError(error.response?.data?.message || 'An error occurred')
    // } finally {
    //   setActionLoading(null)
    // }
  }

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="h-32 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="space-y-6">
                {[...Array(2)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="h-48 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Customer</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <div className="space-x-4">
            <Button onClick={fetchCustomerDetails}>Try Again</Button>
            <Button variant="outline" onClick={() => router.push('/customers')}>
              Back to Customers
            </Button>
          </div>
        </div>
      </Layout>
    )
  }

  if (!customer) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Customer not found</p>
          <Button onClick={() => router.push('/customers')}>Back to Customers</Button>
        </div>
      </Layout>
    )
  }

  const StatusIcon = customer.subscription?.status ? 
    statusIcons[customer.subscription.status as keyof typeof statusIcons] || CheckCircle : 
    CheckCircle
  
  const statusColor = customer.subscription?.status ? 
    statusColors[customer.subscription.status as keyof typeof statusColors] || statusColors.active :
    statusColors.active

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/customers')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{customer.fullName}</h1>
              <p className="text-gray-600">Customer Details</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Customer
            </Button>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">
                          {customer.firstName?.charAt(0) || customer.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{customer.fullName}</h3>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">{customer.email}</span>
                          {customer.emailVerified && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Joined: {formatDate(customer.createdAt)}
                      </span>
                    </div>
                    {customer.lastLoginAt && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          Last login: {formatDateTime(customer.lastLoginAt)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Total Revenue: {formatCurrency(customer.totalRevenue || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription History */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customer.subscriptionHistory.map((subscription, index) => (
                    <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{subscription.planName}</h4>
                        <p className="text-sm text-gray-600">
                          {formatDate(subscription.startDate)} - {formatDate(subscription.endDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                          subscription.status === 'canceled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {subscription.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Invoice History */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customer.invoiceHistory.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{formatCurrency(invoice.amount)}</h4>
                        <p className="text-sm text-gray-600">
                          Due: {formatDate(invoice.dueDate)}
                          {invoice.paidDate && ` • Paid: ${formatDate(invoice.paidDate)}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Subscription */}
            <Card>
              <CardHeader>
                <CardTitle>Current Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                {customer.subscription ? (
                  <div className="space-y-4">
                    <div className={`flex items-center justify-center p-3 rounded-lg border ${statusColor}`}>
                      <StatusIcon className="h-5 w-5 mr-2" />
                      <span className="font-medium capitalize">{customer.subscription.status}</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium">{customer.subscription.plan.name}</h4>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrency(customer.subscription.plan.price)}
                          <span className="text-sm font-normal text-gray-600">
                            /{customer.subscription.plan.billingCycle}
                          </span>
                        </p>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Max Groups: {customer.subscription.plan.maxGroups}</p>
                        <p>Max Users per Group: {customer.subscription.plan.maxUsersPerGroup}</p>
                        <p>Max Players per Group: {customer.subscription.plan.maxPlayersPerGroup}</p>
                      </div>
                      
                      <div className="border-t pt-3">
                        <p className="text-sm text-gray-600">
                          Started: {formatDate(customer.subscription.startDate)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {customer.subscription.status === 'trial' && customer.subscription.trialEndDate
                            ? `Trial ends: ${formatDate(customer.subscription.trialEndDate)}`
                            : `Next billing: ${formatDate(customer.subscription.endDate)}`
                          }
                        </p>
                      </div>
                    </div>

                    {/* Subscription Actions */}
                    <div className="border-t pt-4 space-y-2">
                      {customer.subscription.status === 'active' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleSubscriptionAction('upgrade', customer.subscription.plan.id + 1)}
                            disabled={actionLoading === 'upgrade'}
                          >
                            {actionLoading === 'upgrade' ? (
                              <>
                                <TrendingUp className="h-4 w-4 mr-2 animate-spin" />
                                Upgrading...
                              </>
                            ) : (
                              <>
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Upgrade Plan
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleSubscriptionAction('cancel')}
                            disabled={actionLoading === 'cancel'}
                          >
                            {actionLoading === 'cancel' ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2 animate-spin" />
                                Canceling...
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Subscription
                              </>
                            )}
                          </Button>
                        </>
                      )}
                      
                      {customer.subscription.status === 'canceled' && (
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full"
                          onClick={() => handleSubscriptionAction('reactivate')}
                          disabled={actionLoading === 'reactivate'}
                        >
                          {actionLoading === 'reactivate' ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
                              Reactivating...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Reactivate Subscription
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No active subscription</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Groups */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Groups ({customer.groups.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customer.groups.map((group) => (
                    <div key={group.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{group.name}</h4>
                        <p className="text-sm text-gray-600 capitalize">{group.role}</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDate(group.joinedAt)}
                      </p>
                    </div>
                  ))}
                  
                  {customer.groups.length === 0 && (
                    <div className="text-center py-6">
                      <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm">No groups joined</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  ) 
}