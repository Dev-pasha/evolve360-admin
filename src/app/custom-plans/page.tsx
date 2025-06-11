'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/app/components/layout/layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api-client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  DollarSign, 
  TrendingUp,
  Settings,
  Eye,
  MoreVertical,
  Package,
  CheckCircle,
  XCircle,
  Star,
  Crown,
  AlertTriangle
} from 'lucide-react'
import CreateCustomPlanModal from '@/app/components/custom-plans/create-custom-plans-modal'
import EditCustomPlanModal from '@/app/components/custom-plans/edit-custom-plans-modal'

interface CustomPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  billingCycle: string;
  limits: {
    maxGroups: number;
    maxUsersPerGroup: number;
    maxPlayersPerGroup: number;
  };
  createdAt: string;
  updatedAt: string;
  customer: {
    id: number;
    email: string;
    name: string;
    subscriptionStatus: string;
  };
}

export default function CustomPlansPage() {
  const [customPlans, setCustomPlans] = useState<CustomPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<CustomPlan | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchCustomPlans()
  }, [])

  const fetchCustomPlans = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getAllCustomPlans()
      if (response.status === 'success') {
        setCustomPlans(response.data)
      } else {
        setError(response.message || 'Failed to fetch custom plans')
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCustomPlan = async (customerId: number, planData: any) => {
    try {
      const response = await apiClient.createCustomPlan(customerId, planData)
      if (response.status === 'success') {
        await fetchCustomPlans()
        setShowCreateModal(false)
        return { success: true }
      } else {
        return { success: false, error: response.message }
      }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to create custom plan' }
    }
  }

  const handleEditCustomPlan = async (planId: number, modifications: any) => {
    try {
      const response = await apiClient.modifyCustomPlanLimits(planId, modifications)
      if (response.status === 'success') {
        await fetchCustomPlans()
        setEditingPlan(null)
        return { success: true }
      } else {
        return { success: false, error: response.message }
      }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to modify custom plan' }
    }
  }

  const handleDeleteCustomPlan = async (planId: number) => {
    if (!confirm('Are you sure you want to delete this custom plan? This action cannot be undone.')) {
      return
    }

    try {
      setActionLoading(planId)
      const response = await apiClient.deleteCustomPlan(planId)
      if (response.status === 'success') {
        setCustomPlans(plans => plans.filter(p => p.id !== planId))
      } else {
        setError(response.message || 'Failed to delete custom plan')
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200'
      case 'trial': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'canceled': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const calculateStats = () => {
    const totalRevenue = customPlans.reduce((sum, plan) => 
      sum + (plan.customer.subscriptionStatus === 'active' ? plan.price : 0), 0
    )
    const averagePrice = customPlans.length > 0 ? 
      customPlans.reduce((sum, plan) => sum + plan.price, 0) / customPlans.length : 0
    const activeCount = customPlans.filter(plan => plan.customer.subscriptionStatus === 'active').length

    return { totalRevenue, averagePrice, activeCount }
  }

  const stats = calculateStats()

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-64 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Crown className="h-8 w-8 mr-3 text-yellow-500" />
              Custom Plans
            </h1>
            <p className="text-gray-600">Manage tailored subscription plans for enterprise customers</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Plan
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
              <Button variant="outline" size="sm" className="mt-2" onClick={fetchCustomPlans}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Custom Plans</p>
                  <p className="text-3xl font-bold text-gray-900">{customPlans.length}</p>
                </div>
                <Package className="h-12 w-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <DollarSign className="h-12 w-12 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Price</p>
                  <p className="text-3xl font-bold text-purple-600">{formatCurrency(stats.averagePrice)}</p>
                </div>
                <TrendingUp className="h-12 w-12 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Custom Plans Grid */}
        {customPlans.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Crown className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No custom plans created yet</h3>
              <p className="text-gray-600 mb-6">
                Create custom subscription plans with tailored pricing and limits for your enterprise customers.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Custom Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customPlans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                          CUSTOM
                        </span>
                      </div>
                      <CardTitle className="text-lg line-clamp-2">{plan.name}</CardTitle>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">{plan.description}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Customer Info */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{plan.customer.name}</p>
                        <p className="text-xs text-gray-600">{plan.customer.email}</p>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(plan.customer.subscriptionStatus)}`}>
                        {plan.customer.subscriptionStatus === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {plan.customer.subscriptionStatus === 'canceled' && <XCircle className="h-3 w-3 mr-1" />}
                        {plan.customer.subscriptionStatus}
                      </span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="text-center py-3 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(plan.price)}
                    </div>
                    <div className="text-sm text-gray-600 capitalize">
                      per {plan.billingCycle}
                    </div>
                  </div>

                  {/* Plan Limits */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 text-sm">Custom Limits</h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="font-bold text-blue-600">{plan.limits.maxGroups}</div>
                        <div className="text-blue-600">Groups</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="font-bold text-green-600">{plan.limits.maxUsersPerGroup}</div>
                        <div className="text-green-600">Users/Group</div>
                      </div>
                      <div className="text-center p-2 bg-purple-50 rounded">
                        <div className="font-bold text-purple-600">{plan.limits.maxPlayersPerGroup}</div>
                        <div className="text-purple-600">Players/Group</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/customers/${plan.customer.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Customer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPlan(plan)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCustomPlan(plan.id)}
                      disabled={actionLoading === plan.id}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      {actionLoading === plan.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {/* Metadata */}
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    <p>Created: {formatDate(plan.createdAt)}</p>
                    {plan.updatedAt !== plan.createdAt && (
                      <p>Updated: {formatDate(plan.updatedAt)}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modals */}
        {showCreateModal && (
          <CreateCustomPlanModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleCreateCustomPlan}
          />
        )}

        {editingPlan && (
          <EditCustomPlanModal
            plan={editingPlan}
            onClose={() => setEditingPlan(null)}
            onSuccess={(modifications) => handleEditCustomPlan(editingPlan.id, modifications)}
          />
        )}
      </div>
    </Layout>
  )
}