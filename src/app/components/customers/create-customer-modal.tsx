'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient, Plan } from '@/lib/api-client'
import { X, UserPlus, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'

interface CreateCustomerModalProps {
  onClose: () => void
  onSuccess: (customerData: any) => Promise<{ success: boolean; error?: string }>
}

export default function CreateCustomerModal({ onClose, onSuccess }: CreateCustomerModalProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    planId: '',
    trialDays: '14',
    sendWelcomeEmail: true,
    customNotes: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [generatePassword, setGeneratePassword] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await apiClient.getPlans()
      if (response.status === 'success') {
        setPlans(response.data.filter(plan => plan.isActive))
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const validateForm = () => {
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      return 'Valid email is required'
    }
    if (!generatePassword && (!formData.password || formData.password.length < 8)) {
      return 'Password must be at least 8 characters'
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
      const customerData: any = {
        email: formData.email,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        planId: formData.planId ? parseInt(formData.planId) : undefined,
        trialDays: formData.trialDays ? parseInt(formData.trialDays) : undefined,
        sendWelcomeEmail: formData.sendWelcomeEmail,
        customNotes: formData.customNotes || undefined,
      }

      if (!generatePassword && formData.password) {
        customerData.password = formData.password
      }

      const result = await onSuccess(customerData)
      
      if (result.success) {
        setSuccess('Customer created successfully!')
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setError(result.error || 'Failed to create customer')
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
            <UserPlus className="h-5 w-5 mr-2" />
            Create New Customer
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
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Customer Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="customer@example.com"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

            {/* Password Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Password Settings</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="generatePassword"
                    checked={generatePassword}
                    onChange={(e) => {
                      setGeneratePassword(e.target.checked)
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, password: '' }))
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="generatePassword">Generate temporary password automatically</Label>
                </div>

                {!generatePassword && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter password"
                        required={!generatePassword}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Minimum 8 characters with uppercase, lowercase, and number
                    </p>
                  </div>
                )}

                {generatePassword && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm">
                      A temporary password will be generated and sent to the customer via email.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Subscription Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Subscription Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="planId">Initial Plan (Optional)</Label>
                  <select
                    id="planId"
                    name="planId"
                    value={formData.planId}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="">No plan (create customer only)</option>
                    {plans.map(plan => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} - ${plan.price}/{plan.billingCycle}
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
                    placeholder="14"
                  />
                  <p className="text-xs text-gray-500">0-365 days (only if plan is selected)</p>
                </div>
              </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Additional Options</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sendWelcomeEmail"
                    name="sendWelcomeEmail"
                    checked={formData.sendWelcomeEmail}
                    onChange={handleInputChange}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="sendWelcomeEmail">Send welcome email to customer</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customNotes">Custom Notes</Label>
                  <textarea
                    id="customNotes"
                    name="customNotes"
                    value={formData.customNotes}
                    onChange={handleInputChange}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    placeholder="Internal notes about this customer..."
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            {formData.planId && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-2">Customer Summary</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Email:</strong> {formData.email || 'Not provided'}</p>
                  <p><strong>Name:</strong> {`${formData.firstName} ${formData.lastName}`.trim() || 'Not provided'}</p>
                  {formData.planId && (
                    <>
                      <p><strong>Plan:</strong> {plans.find(p => p.id.toString() === formData.planId)?.name}</p>
                      <p><strong>Trial:</strong> {formData.trialDays} days</p>
                    </>
                  )}
                  <p><strong>Welcome Email:</strong> {formData.sendWelcomeEmail ? 'Yes' : 'No'}</p>
                </div>
              </div>
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
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Customer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}