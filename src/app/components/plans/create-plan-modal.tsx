'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Package, AlertCircle, CheckCircle } from 'lucide-react'

interface CreatePlanModalProps {
  onClose: () => void
  onSuccess: (planData: any) => Promise<{ success: boolean; error?: string }>
}

export default function CreatePlanModal({ onClose, onSuccess }: CreatePlanModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    billing_cycle: 'monthly' as 'monthly' | 'quarterly' | 'annual',
    max_groups: '',
    max_users_per_group: '',
    max_players_per_group: '',
    is_custom: false,
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
    if (!formData.price || parseFloat(formData.price) <= 0) {
      return 'Price must be greater than 0'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const planData = {
        ...formData,
        price: parseFloat(formData.price),
        max_groups: parseInt(formData.max_groups),
        max_users_per_group: parseInt(formData.max_users_per_group),
        max_players_per_group: parseInt(formData.max_players_per_group),
      }

      const result = await onSuccess(planData)
      
      if (result.success) {
        setSuccess('Plan created successfully!')
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setError(result.error || 'Failed to create plan')
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
            <Package className="h-5 w-5 mr-2" />
            Create New Plan
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
                    placeholder="e.g., Pro Plan"
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
                    placeholder="29.99"
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
                  placeholder="Brief description of the plan"
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
                    placeholder="10"
                    required
                  />
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
                    placeholder="50"
                    required
                  />
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
                    placeholder="100"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Plan Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Options</h3>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_custom"
                  name="is_custom"
                  checked={formData.is_custom}
                  onChange={handleInputChange}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_custom">Custom Plan (for enterprise customers)</Label>
              </div>
            </div>

            {/* Preview */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-2">Plan Preview</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Name:</strong> {formData.name || 'Plan Name'}</p>
                <p><strong>Price:</strong> ${formData.price || '0.00'}/{formData.billing_cycle}</p>
                <p><strong>Groups:</strong> {formData.max_groups || '0'}</p>
                <p><strong>Users per Group:</strong> {formData.max_users_per_group || '0'}</p>
                <p><strong>Players per Group:</strong> {formData.max_players_per_group || '0'}</p>
              </div>
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
                {loading ? 'Creating...' : 'Create Plan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}