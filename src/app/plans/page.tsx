'use client'

import { useState, useEffect } from 'react'
import Layout from '@/app/components/layout/layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiClient, Plan } from '@/lib/api-client'
import { formatCurrency } from '@/lib/utils'
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
  XCircle
} from 'lucide-react'
import CreatePlanModal from '@/app/components/plans/create-plan-modal'
import EditPlanModal from '@/app/components/plans/edit-plan-modal'

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getPlans()
      if (response.status === 'success') {
        setPlans(response.data)
      } else {
        setError(response.message || 'Failed to fetch plans')
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlan = async (planData: any) => {
    try {
      const response = await apiClient.createPlan(planData)
      if (response.status === 'success') {
        setPlans([...plans, response.data])
        setShowCreateModal(false)
        return { success: true }
      } else {
        return { success: false, error: response.message }
      }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to create plan' }
    }
  }

  const handleUpdatePlan = async (planId: number, updateData: any) => {
    try {
      const response = await apiClient.updatePlan(planId, updateData)
      if (response.status === 'success') {
        setPlans(plans.map(p => p.id === planId ? response.data : p))
        setEditingPlan(null)
        return { success: true }
      } else {
        return { success: false, error: response.message }
      }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || 'Failed to update plan' }
    }
  }

  const handleDeactivatePlan = async (planId: number) => {
    if (!confirm('Are you sure you want to deactivate this plan? This action cannot be undone.')) {
      return
    }

    try {
      setActionLoading(planId)
      const response = await apiClient.deactivatePlan(planId)
      if (response.status === 'success') {
        setPlans(plans.map(p => p.id === planId ? { ...p, isActive: false } : p))
      } else {
        setError(response.message || 'Failed to deactivate plan')
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const getPlanStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'text-green-600 bg-green-50 border-green-200'
      : 'text-red-600 bg-red-50 border-red-200'
  }

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-48 bg-gray-200 rounded"></div>
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Plans Management</h1>
            <p className="text-gray-600">Create and manage subscription plans for your customers</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-800">{error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={fetchPlans}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPlanStatusColor(plan.isActive)}`}>
                      {plan.isActive ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Pricing */}
                <div className="text-center py-4 border rounded-lg bg-gray-50">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatCurrency(plan.price)}
                  </div>
                  <div className="text-sm text-gray-600 capitalize">
                    per {plan.billingCycle}
                  </div>
                </div>

                {/* Plan Limits */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Plan Limits</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Max Groups:</span>
                      <span className="font-medium">{plan.limits.maxGroups}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Users per Group:</span>
                      <span className="font-medium">{plan.limits.maxUsersPerGroup}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Players per Group:</span>
                      <span className="font-medium">{plan.limits.maxPlayersPerGroup}</span>
                    </div>
                  </div>
                </div>

                {/* Analytics */}
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Performance</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">
                        {plan.analytics?.activeSubscriptions}
                      </div>
                      <div className="text-xs text-blue-600">Active</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-lg font-bold text-yellow-600">
                        {plan.analytics.trialSubscriptions}
                      </div>
                      <div className="text-xs text-yellow-600">Trial</div>
                    </div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(plan.analytics.monthlyRevenue)}
                    </div>
                    <div className="text-xs text-green-600">Monthly Revenue</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditingPlan(plan)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  {plan.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeactivatePlan(plan.id)}
                      disabled={actionLoading === plan.id}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      {actionLoading === plan.id ? (
                        <Trash2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {plans.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No plans created yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first subscription plan to start managing customer subscriptions.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Plan
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Modals */}
        {showCreateModal && (
          <CreatePlanModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleCreatePlan}
          />
        )}

        {editingPlan && (
          <EditPlanModal
            plan={editingPlan}
            onClose={() => setEditingPlan(null)}
            onSuccess={(updateData) => handleUpdatePlan(editingPlan.id, updateData)}
          />
        )}
      </div>
    </Layout>
  )
}