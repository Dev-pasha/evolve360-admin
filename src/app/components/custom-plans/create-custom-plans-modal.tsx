'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient, Customer } from '@/lib/api-client'
import { formatCurrency } from '@/lib/utils'
import { X, Crown, AlertCircle, CheckCircle, Search, User } from 'lucide-react'

interface CreateCustomPlanModalProps {
  onClose: () => void
  onSuccess: (customerId: number, planData: any) => Promise<{ success: boolean; error?: string }>
}

export default function CreateCustomPlanModal({ onClose, onSuccess }: CreateCustomPlanModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerList, setShowCustomerList] = useState(false)
  const [formData, setFormData] = useState({
    planName: '',
    description: '',
    customPricing: '',
    billingCycle: 'monthly' as 'monthly' | 'quarterly' | 'annual',
    customLimits: {
      maxGroups: '',
      maxUsersPerGroup: '',
      maxPlayersPerGroup: '',
    },
    trialDays: '0',
    adminNotes: '',
    cancelExistingSubscription: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const billingCycles = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'annual', label: 'Annual' },
  ]

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await apiClient.getCustomers(1, 100) // Get first 100 customers
      if (response.status === 'success') {
        setCustomers(response.data.customers || [])
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.fullName.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.email.toLowerCase().includes(customerSearch.toLowerCase())
  )

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerSearch('')
    setShowCustomerList(false)
    
    // Auto-generate plan name
    if (!formData.planName) {
      const companyName = customer.fullName.split(' ')[0] || customer.email.split('@')[0]
      setFormData(prev => ({
        ...prev,
        planName: `${companyName} Custom Enterprise Plan`
      }))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
    if (!selectedCustomer) {
      return 'Please select a customer'
    }
    if (!formData.planName.trim() || formData.planName.length < 3) {
      return 'Plan name must be at least 3 characters'
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
    if (formData.trialDays && (parseInt(formData.trialDays) < 0 || parseInt(formData.trialDays) > 365)) {
      return 'Trial days must be between 0 and 365'
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
        planName: formData.planName,
        description: formData.description || undefined,
        customPricing: parseFloat(formData.customPricing),
        billingCycle: formData.billingCycle,
        customLimits: {
          maxGroups: parseInt(formData.customLimits.maxGroups),
          maxUsersPerGroup: parseInt(formData.customLimits.maxUsersPerGroup),
          maxPlayersPerGroup: parseInt(formData.customLimits.maxPlayersPerGroup),
        },
        trialDays: parseInt(formData.trialDays) || undefined,
        adminNotes: formData.adminNotes || undefined,
        cancelExistingSubscription: formData.cancelExistingSubscription,
      }

      const result = await onSuccess(selectedCustomer!.id, planData)
      
      if (result.success) {
        setSuccess('Custom plan created successfully!')
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setError(result.error || 'Failed to create custom plan')
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="flex items-center">
            <Crown className="h-5 w-5 mr-2 text-yellow-500" />
            Create Custom Plan
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
            {/* Customer Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Select Customer</h3>
              
              {!selectedCustomer ? (
                <div className="space-y-2">
                  <Label htmlFor="customerSearch">Search Customer</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="customerSearch"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value)
                        setShowCustomerList(true)
                      }}
                      onFocus={() => setShowCustomerList(true)}
                      placeholder="Search by name or email..."
                      className="pl-10"
                    />
                  </div>

                  {showCustomerList && filteredCustomers.length > 0 && (
                    <div className="border rounded-lg max-h-48 overflow-y-auto">
                      {filteredCustomers.slice(0, 10).map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => handleCustomerSelect(customer)}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {customer.firstName?.charAt(0) || customer.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{customer.fullName}</p>
                              <p className="text-sm text-gray-600">{customer.email}</p>
                              {customer.subscription && (
                                <p className="text-xs text-gray-500">
                                  Current: {customer.subscription.planName} - {customer.subscription.status}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {showCustomerList && filteredCustomers.length === 0 && customerSearch && (
                    <div className="text-center py-4 text-gray-500">
                      No customers found matching "{customerSearch}"
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 border rounded-lg bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white font-medium">
                          {selectedCustomer.firstName?.charAt(0) || selectedCustomer.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedCustomer.fullName}</p>
                        <p className="text-sm text-gray-600">{selectedCustomer.email}</p>
                        {selectedCustomer.subscription && (
                          <p className="text-xs text-gray-500">
                            Current: {selectedCustomer.subscription.planName} ({selectedCustomer.subscription.status})
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCustomer(null)}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {selectedCustomer && (
              <>
                {/* Plan Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Plan Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="planName">Plan Name *</Label>
                      <Input
                        id="planName"
                        name="planName"
                        value={formData.planName}
                        onChange={handleInputChange}
                        placeholder="e.g., Acme Corp Enterprise Plan"
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
                        max="100000"
                        value={formData.customPricing}
                        onChange={handleInputChange}
                        placeholder="599.99"
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
                      placeholder="Custom enterprise plan description"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billingCycle">Billing Cycle *</Label>
                      <select
                        id="billingCycle"
                        name="billingCycle"
                        value={formData.billingCycle}
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

                    <div className="space-y-2">
                      <Label htmlFor="trialDays">Trial Days</Label>
                      <Input
                        id="trialDays"
                        name="trialDays"
                        type="number"
                        min="0"
                        max="365"
                        value={formData.trialDays}
                        onChange={handleInputChange}
                        placeholder="30"
                      />
                    </div>
                  </div>
                </div>

                {/* Custom Limits */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Custom Limits</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customLimits.maxGroups">Max Groups *</Label>
                      <Input
                        id="customLimits.maxGroups"
                        name="customLimits.maxGroups"
                        type="number"
                        min="1"
                        max="50000"
                        value={formData.customLimits.maxGroups}
                        onChange={handleInputChange}
                        placeholder="250"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customLimits.maxUsersPerGroup">Max Users per Group *</Label>
                      <Input
                        id="customLimits.maxUsersPerGroup"
                        name="customLimits.maxUsersPerGroup"
                        type="number"
                        min="1"
                        max="10000"
                        value={formData.customLimits.maxUsersPerGroup}
                        onChange={handleInputChange}
                        placeholder="500"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customLimits.maxPlayersPerGroup">Max Players per Group *</Label>
                      <Input
                        id="customLimits.maxPlayersPerGroup"
                        name="customLimits.maxPlayersPerGroup"
                        type="number"
                        min="1"
                        max="100000"
                        value={formData.customLimits.maxPlayersPerGroup}
                        onChange={handleInputChange}
                        placeholder="2000"
                        required
                      />
                    </div>
                  </div>

                  {/* Comparison with current plan */}
                  {selectedCustomer.subscription && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2">Current Plan Comparison</h4>
                      <div className="text-sm text-yellow-700 space-y-1">
                        <p>Current Plan: {selectedCustomer.subscription.planName}</p>
                        <p>Current Price: {formatCurrency(selectedCustomer.subscription.price)}/{selectedCustomer.subscription.billingCycle}</p>
                        <div className="grid grid-cols-3 gap-4 mt-2">
                          <div>
                            <span className="font-medium">Groups:</span>
                            <div>Current: Unknown</div>
                            <div>New: {formData.customLimits.maxGroups || '?'}</div>
                          </div>
                          <div>
                            <span className="font-medium">Users/Group:</span>
                            <div>Current: Unknown</div>
                            <div>New: {formData.customLimits.maxUsersPerGroup || '?'}</div>
                          </div>
                          <div>
                            <span className="font-medium">Players/Group:</span>
                            <div>Current: Unknown</div>
                            <div>New: {formData.customLimits.maxPlayersPerGroup || '?'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Options */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Additional Options</h3>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="adminNotes">Admin Notes</Label>
                      <textarea
                        id="adminNotes"
                        name="adminNotes"
                        value={formData.adminNotes}
                        onChange={handleInputChange}
                        rows={3}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        placeholder="Internal notes about this custom plan..."
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="cancelExistingSubscription"
                        name="cancelExistingSubscription"
                        checked={formData.cancelExistingSubscription}
                        onChange={handleInputChange}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="cancelExistingSubscription">
                        Cancel existing subscription when creating custom plan
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-2">Custom Plan Preview</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Customer:</strong> {selectedCustomer.fullName}</p>
                    <p><strong>Plan Name:</strong> {formData.planName || 'Not specified'}</p>
                    <p><strong>Price:</strong> ${formData.customPricing || '0.00'}/{formData.billingCycle}</p>
                    <p><strong>Limits:</strong> {formData.customLimits.maxGroups || '0'} groups, {formData.customLimits.maxUsersPerGroup || '0'} users/group, {formData.customLimits.maxPlayersPerGroup || '0'} players/group</p>
                    <p><strong>Trial:</strong> {formData.trialDays} days</p>
                    <p><strong>Cancel Existing:</strong> {formData.cancelExistingSubscription ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </>
            )}

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
                disabled={loading || !selectedCustomer}
              >
                {loading ? 'Creating Custom Plan...' : 'Create Custom Plan'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}