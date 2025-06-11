'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient, Customer } from '@/lib/api-client'
import { formatCurrency } from '@/lib/utils'
import { X, RefreshCw, AlertCircle, CheckCircle, ArrowRight, Clock } from 'lucide-react'

interface PlanConversionModalProps {
  customer: Customer
  onClose: () => void
  onSuccess: () => void
}

interface ConversionPreview {
  customer: {
    id: number;
    email: string;
    name: string;
  };
  currentSubscription: {
    id: number;
    status: string;
    planName: string;
    price: number;
    billingCycle: string;
    limits: {
      maxGroups: number;
      maxUsersPerGroup: number;
      maxPlayersPerGroup: number;
    };
    endDate: string;
    remainingDays: number;
  };
  currentUsage: {
    groupCount: number;
    maxUsersPerGroup: number;
  };
  conversionImpact: {
    subscriptionTimePreserved: string;
    canReduceLimits: {
      groups: boolean;
      usersPerGroup: boolean;
    };
    suggestedMinimumLimits: {
      maxGroups: number;
      maxUsersPerGroup: number;
      maxPlayersPerGroup: number;
    };
  };
}

export default function PlanConversionModal({ customer, onClose, onSuccess }: PlanConversionModalProps) {
  const [preview, setPreview] = useState<ConversionPreview | null>(null)
  const [formData, setFormData] = useState({
    customPlanName: '',
    customPricing: '',
    customLimits: {
      maxGroups: '',
      maxUsersPerGroup: '',
      maxPlayersPerGroup: '',
    },
    adminNotes: '',
    keepCurrentBillingCycle: true,
  })
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchPreview()
  }, [customer.id])

  const fetchPreview = async () => {
    try {
      setPreviewLoading(true)
      const response = await apiClient.previewPlanConversion(customer.id)
      if (response.status === 'success') {
        setPreview(response.data)
        
        // Auto-fill form with suggested values
        const companyName = response.data.customer.name.split(' ')[0] || response.data.customer.email.split('@')[0]
        setFormData(prev => ({
          ...prev,
          customPlanName: `${companyName} Custom Plan`,
          customPricing: response.data.currentSubscription.price.toString(),
          customLimits: {
            maxGroups: response.data.conversionImpact.suggestedMinimumLimits.maxGroups.toString(),
            maxUsersPerGroup: response.data.conversionImpact.suggestedMinimumLimits.maxUsersPerGroup.toString(),
            maxPlayersPerGroup: response.data.conversionImpact.suggestedMinimumLimits.maxPlayersPerGroup.toString(),
          },
        }))
      } else {
        setError(response.message || 'Failed to load conversion preview')
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (name.startsWith('customLimits.')) {
      const limitField = name.replace('customLimits.', '')
      setFormData(prev => ({
        ...prev,
        customLimits: {
          ...prev.customLimits,
          [limitField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }))
    }
  }

  const validateForm = () => {
    if (!formData.customPlanName.trim()) {
      return 'Custom plan name is required'
    }
    if (!formData.customPricing || parseFloat(formData.customPricing) <= 0) {
      return 'Custom pricing must be greater than 0'
    }
    if (!formData.customLimits.maxGroups || parseInt(formData.customLimits.maxGroups) <= 0) {
      return 'Max groups must be greater than 0'
    }
    if (!formData.customLimits.maxUsersPerGroup || parseInt(formData.customLimits.maxUsersPerGroup) <= 0) {
      return 'Max users per group must be greater than 0'
    }
    if (!formData.customLimits.maxPlayersPerGroup || parseInt(formData.customLimits.maxPlayersPerGroup) <= 0) {
      return 'Max players per group must be greater than 0'
    }

    // Check against current usage
    if (preview) {
      const newGroups = parseInt(formData.customLimits.maxGroups)
      const newUsersPerGroup = parseInt(formData.customLimits.maxUsersPerGroup)
      
      if (newGroups < preview.currentUsage.groupCount) {
        return `Cannot set groups to ${newGroups}. Customer is using ${preview.currentUsage.groupCount} groups.`
      }
      
      if (newUsersPerGroup < preview.currentUsage.maxUsersPerGroup) {
        return `Cannot set users per group to ${newUsersPerGroup}. Some groups have ${preview.currentUsage.maxUsersPerGroup} users.`
      }
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
      const conversionData = {
        customPlanName: formData.customPlanName,
        customPricing: parseFloat(formData.customPricing),
        customLimits: {
          maxGroups: parseInt(formData.customLimits.maxGroups),
          maxUsersPerGroup: parseInt(formData.customLimits.maxUsersPerGroup),
          maxPlayersPerGroup: parseInt(formData.customLimits.maxPlayersPerGroup),
        },
        adminNotes: formData.adminNotes || undefined,
        keepCurrentBillingCycle: formData.keepCurrentBillingCycle,
      }

      const response = await apiClient.convertToCustomPlan(customer.id, conversionData)
      
      if (response.status === 'success') {
        setSuccess('Plan converted to custom successfully!')
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1500)
      } else {
        setError(response.message || 'Failed to convert plan')
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (previewLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading conversion preview...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!preview) {
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Preview</h3>
              <p className="text-gray-600 mb-6">{error || 'Failed to load conversion preview'}</p>
              <div className="space-x-4">
                <Button onClick={fetchPreview}>Try Again</Button>
                <Button variant="outline" onClick={onClose}>Close</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="flex items-center">
            <RefreshCw className="h-5 w-5 mr-2" />
            Convert to Custom Plan: {preview.customer.name}
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

          {/* Current Plan Overview */}
          <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Current Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Plan:</strong> {preview.currentSubscription.planName}</p>
                <p><strong>Price:</strong> {formatCurrency(preview.currentSubscription.price)}/{preview.currentSubscription.billingCycle}</p>
                <p><strong>Status:</strong> <span className="capitalize">{preview.currentSubscription.status}</span></p>
                <p><strong>Remaining:</strong> {preview.currentSubscription.remainingDays} days</p>
                <div className="text-xs text-blue-700 mt-2">
                  <p>Limits: {preview.currentSubscription.limits.maxGroups} groups, {preview.currentSubscription.limits.maxUsersPerGroup} users/group</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Current Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Groups Used:</strong> {preview.currentUsage.groupCount} / {preview.currentSubscription.limits.maxGroups}</p>
                <p><strong>Max Users/Group:</strong> {preview.currentUsage.maxUsersPerGroup} / {preview.currentSubscription.limits.maxUsersPerGroup}</p>
                <div className="text-xs text-green-700 mt-2">
                  <p>Subscription time preserved: {preview.conversionImpact.subscriptionTimePreserved}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Custom Plan Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <ArrowRight className="h-5 w-5 mr-2" />
                New Custom Plan Configuration
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customPlanName">Custom Plan Name *</Label>
                  <Input
                    id="customPlanName"
                    name="customPlanName"
                    value={formData.customPlanName}
                    onChange={handleInputChange}
                    placeholder="e.g., Acme Custom Plan"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customPricing">Custom Pricing ($) *</Label>
                  <Input
                    id="customPricing"
                    name="customPricing"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.customPricing}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Custom Limits */}
            <div className="space-y-4">
              <h4 className="font-medium">Custom Limits</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customLimits.maxGroups">Max Groups *</Label>
                  <Input
                    id="customLimits.maxGroups"
                    name="customLimits.maxGroups"
                    type="number"
                    min="1"
                    value={formData.customLimits.maxGroups}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Minimum: {preview.conversionImpact.suggestedMinimumLimits.maxGroups} (current usage)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customLimits.maxUsersPerGroup">Max Users per Group *</Label>
                  <Input
                    id="customLimits.maxUsersPerGroup"
                    name="customLimits.maxUsersPerGroup"
                    type="number"
                    min="1"
                    value={formData.customLimits.maxUsersPerGroup}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Minimum: {preview.conversionImpact.suggestedMinimumLimits.maxUsersPerGroup} (current usage)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customLimits.maxPlayersPerGroup">Max Players per Group *</Label>
                  <Input
                    id="customLimits.maxPlayersPerGroup"
                    name="customLimits.maxPlayersPerGroup"
                    type="number"
                    min="1"
                    value={formData.customLimits.maxPlayersPerGroup}
                    onChange={handleInputChange}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Suggested: {preview.conversionImpact.suggestedMinimumLimits.maxPlayersPerGroup}
                  </p>
                </div>
              </div>
            </div>

            {/* Conversion Options */}
            <div className="space-y-4">
              <h4 className="font-medium">Conversion Options</h4>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="keepCurrentBillingCycle"
                    name="keepCurrentBillingCycle"
                    checked={formData.keepCurrentBillingCycle}
                    onChange={handleInputChange}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="keepCurrentBillingCycle">
                    Keep current billing cycle ({preview.currentSubscription.billingCycle})
                  </Label>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-2">
                  <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Timing Preservation</p>
                    <p>The customer's remaining {preview.conversionImpact.subscriptionTimePreserved} will be preserved in the new custom plan.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminNotes">Admin Notes</Label>
                  <textarea
                    id="adminNotes"
                    name="adminNotes"
                    value={formData.adminNotes}
                    onChange={handleInputChange}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    placeholder="Reason for conversion..."
                  />
                </div>
              </div>
            </div>

            {/* Conversion Preview */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-2">Conversion Summary</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>From:</strong> {preview.currentSubscription.planName} ({formatCurrency(preview.currentSubscription.price)}/{preview.currentSubscription.billingCycle})</p>
                <p><strong>To:</strong> {formData.customPlanName} ({formatCurrency(parseFloat(formData.customPricing || '0'))}/{preview.currentSubscription.billingCycle})</p>
                <p><strong>New Limits:</strong> {formData.customLimits.maxGroups} groups, {formData.customLimits.maxUsersPerGroup} users/group, {formData.customLimits.maxPlayersPerGroup} players/group</p>
                <p><strong>Time Preserved:</strong> {preview.conversionImpact.subscriptionTimePreserved}</p>
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
                {loading ? 'Converting Plan...' : 'Convert to Custom Plan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}