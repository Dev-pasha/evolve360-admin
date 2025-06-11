'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plan } from '@/lib/api-client'
import { X, Edit, AlertCircle, CheckCircle } from 'lucide-react'

interface EditPlanModalProps {
  plan: Plan
  onClose: () => void
  onSuccess: (updateData: any) => Promise<{ success: boolean; error?: string }>
}

export default function EditPlanModal({ plan, onClose, onSuccess }: EditPlanModalProps) {
  const [formData, setFormData] = useState({
    name: plan.name,
    description: plan.description || '',
    price: plan.price.toString(),
    billing_cycle: plan.billingCycle as 'monthly' | 'quarterly' | 'annual',
    max_groups: plan.limits.maxGroups.toString(),
    max_users_per_group: plan.limits.maxUsersPerGroup.toString(),
    max_players_per_group: plan.limits.maxPlayersPerGroup.toString(),
    is_active: plan.isActive,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const billingCycles = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annual', label: 'Annual' },
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim() || formData.name.length < 3) {
      return 'Plan name must be at least 3 characters'
    }
    if (!formData.price || parseFloat(formData.price) < 0) {
      return 'Price must be 0 or greater'
    }
    if (!formData.max_groups || parseInt(formData.max_groups) <= 0) {
      return 'Max groups must be greater than 0'
    }
    if (!formData.max_users_per_group || parseInt(formData.max_users_per_group) <= 0) {
      return 'Max users per group must be greater than 0'
    }
    if (!formData.max_players_per_group || parseInt(formData.max_players_per_group) <= 0) {
      return 'Max players per group must be greater than 0'
    }
    return null
  }

  const getChangedFields = () => {
    const changes: any = {}
    
    if (formData.name !== plan.name) changes.name = formData.name
    if (formData.description !== (plan.description || '')) changes.description = formData.description
    if (parseFloat(formData.price) !== plan.price) changes.price = parseFloat(formData.price)
    if (formData.billing_cycle !== plan.billingCycle) changes.billing_cycle = formData.billing_cycle
    if (parseInt(formData.max_groups) !== plan.limits.maxGroups) changes.max_groups = parseInt(formData.max_groups)
    if (parseInt(formData.max_users_per_group) !== plan.limits.maxUsersPerGroup) changes.max_users_per_group = parseInt(formData.max_users_per_group)
    if (parseInt(formData.max_players_per_group) !== plan.limits.maxPlayersPerGroup) changes.max_players_per_group = parseInt(formData.max_players_per_group)
    if (formData.is_active !== plan.isActive) changes.is_active = formData.is_active

    return changes
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    const changes = getChangedFields()
    if (Object.keys(changes).length === 0) {
      setError('No changes detected')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await onSuccess(changes)
      
      if (result.success) {
        setSuccess('Plan updated successfully!')
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setError(result.error || 'Failed to update plan')
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="flex items-center">
            <Edit className="h-5 w-5 mr-2" />
            Edit Plan: {plan.name}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Plan Analytics Summary */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Current Plan Performance</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Active:</span>
                <span className="font-medium ml-1">{plan.analytics?.activeSubscriptions}</span>
              </div>
              <div>
                <span className="text-blue-700">Trial:</span>
                <span className="font-medium ml-1">{plan.analytics?.trialSubscriptions}</span>
              </div>
              <div>
                <span className="text-blue-700">Total:</span>
                <span className="font-medium ml-1">{plan.analytics?.totalSubscriptions}</span>
              </div>
              <div>
                <span className="text-blue-700">Revenue:</span>
                <span className="font-medium ml-1">${plan.analytics?.monthlyRevenue}</span>
              </div>
            </div>
            {plan.analytics?.activeSubscriptions > 0 && (
              <p className="text-xs text-blue-700 mt-2">
                ⚠️ Reducing limits below current usage may affect existing customers
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing_cycle">Billing Cycle *</Label>
                <select
                  id="billing_cycle"
                  name="billing_cycle"
                  value={formData.billing_cycle}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  required
                >
                  {billingCycles.map(cycle => (
                    <option key={cycle.value} value={cycle.value}>
                      {cycle.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Plan Limits */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Plan Limits</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_groups">Max Groups *</Label>
                  <Input
                    id="max_groups"
                    name="max_groups"
                    type="number"
                    min="1"
                    value={formData.max_groups}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="text-xs text-gray-500">Current: {plan.limits.maxGroups}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_users_per_group">Max Users per Group *</Label>
                  <Input
                    id="max_users_per_group"
                    name="max_users_per_group"
                    type="number"
                    min="1"
                    value={formData.max_users_per_group}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="text-xs text-gray-500">Current: {plan.limits.maxUsersPerGroup}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_players_per_group">Max Players per Group *</Label>
                  <Input
                    id="max_players_per_group"
                    name="max_players_per_group"
                    type="number"
                    min="1"
                    value={formData.max_players_per_group}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="text-xs text-gray-500">Current: {plan.limits.maxPlayersPerGroup}</p>
                </div>
              </div>
            </div>

            {/* Plan Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Plan Status</h3>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_active">Active (available for new subscriptions)</Label>
              </div>
              
              {!formData.is_active && plan.analytics.activeSubscriptions > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ Deactivating this plan will prevent new subscriptions but won't affect existing customers.
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Plan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}