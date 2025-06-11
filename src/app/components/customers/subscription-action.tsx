'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/lib/api-client'
import { 
  TrendingUp, 
  TrendingDown, 
  XCircle, 
  CheckCircle, 
  AlertTriangle,
  CreditCard
} from 'lucide-react'

interface SubscriptionActionsProps {
  customerId: number
  currentPlanId: number
  currentStatus: string
  onActionComplete: () => void
}

const availablePlans = [
  { id: 1, name: 'Basic Plan', price: 29.99, billingCycle: 'monthly' },
  { id: 2, name: 'Pro Plan', price: 99.99, billingCycle: 'monthly' },
  { id: 3, name: 'Enterprise Plan', price: 199.99, billingCycle: 'monthly' },
]

export default function SubscriptionActions({ 
  customerId, 
  currentPlanId, 
  currentStatus, 
  onActionComplete 
}: SubscriptionActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)
  const [showPlanSelector, setShowPlanSelector] = useState(false)

  const handleSubscriptionAction = async (
    action: 'upgrade' | 'downgrade' | 'cancel' | 'reactivate',
    planId?: number
  ) => {
    try {
      setLoading(action)
      setError('')
      setSuccess('')

      const response = await apiClient.updateCustomerSubscription(customerId, action, planId)
      
      if (response.status === 'success') {
        setSuccess(`Subscription ${action} completed successfully`)
        setShowPlanSelector(false)
        setSelectedPlan(null)
        onActionComplete()
      } else {
        setError(response.message || `Failed to ${action} subscription`)
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred')
    } finally {
      setLoading(null)
    }
  }

  const getAvailableUpgrades = () => {
    return availablePlans.filter(plan => plan.id > currentPlanId)
  }

  const getAvailableDowngrades = () => {
    return availablePlans.filter(plan => plan.id < currentPlanId)
  }

  const renderPlanSelector = (plans: typeof availablePlans, action: 'upgrade' | 'downgrade') => (
    <div className="space-y-3">
      <Label>Select {action === 'upgrade' ? 'Upgrade' : 'Downgrade'} Plan</Label>
      <div className="space-y-2">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
              selectedPlan === plan.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{plan.name}</h4>
                <p className="text-sm text-gray-600">
                  ${plan.price}/{plan.billingCycle}
                </p>
              </div>
              <div className="h-4 w-4 rounded-full border-2 border-gray-300 flex items-center justify-center">
                {selectedPlan === plan.id && (
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex space-x-2">
        <Button
          onClick={() => selectedPlan && handleSubscriptionAction(action, selectedPlan)}
          disabled={!selectedPlan || loading === action}
          className="flex-1"
        >
          {loading === action ? (
            <>
              <CreditCard className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            `Confirm ${action === 'upgrade' ? 'Upgrade' : 'Downgrade'}`
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setShowPlanSelector(false)
            setSelectedPlan(null)
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success/Error Messages */}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Plan Selector */}
        {showPlanSelector && selectedPlan !== null && (
          <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
            {showPlanSelector === 'upgrade' && renderPlanSelector(getAvailableUpgrades(), 'upgrade')}
            {showPlanSelector === 'downgrade' && renderPlanSelector(getAvailableDowngrades(), 'downgrade')}
          </div>
        )}

        {/* Action Buttons */}
        {!showPlanSelector && (
          <div className="space-y-2">
            {currentStatus === 'active' && (
              <>
                {/* Upgrade Button */}
                {getAvailableUpgrades().length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowPlanSelector('upgrade' as any)}
                    disabled={loading !== null}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Upgrade Subscription
                  </Button>
                )}

                {/* Downgrade Button */}
                {getAvailableDowngrades().length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowPlanSelector('downgrade' as any)}
                    disabled={loading !== null}
                  >
                    <TrendingDown className="h-4 w-4 mr-2" />
                    Downgrade Subscription
                  </Button>
                )}

                {/* Cancel Button */}
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleSubscriptionAction('cancel')}
                  disabled={loading !== null}
                >
                  {loading === 'cancel' ? (
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

            {currentStatus === 'canceled' && (
              <Button
                className="w-full justify-start"
                onClick={() => handleSubscriptionAction('reactivate')}
                disabled={loading !== null}
              >
                {loading === 'reactivate' ? (
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

            {(currentStatus === 'past_due' || currentStatus === 'trial') && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                  <p className="text-yellow-800 text-sm">
                    {currentStatus === 'past_due' 
                      ? 'Payment is past due. Customer needs to update payment method.'
                      : 'Customer is in trial period. Actions will be available after trial ends.'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions Info */}
        <div className="pt-3 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Actions</h4>
          <div className="space-y-1 text-xs text-gray-600">
            <p>• Upgrades take effect immediately</p>
            <p>• Downgrades take effect at next billing cycle</p>
            <p>• Cancellations maintain access until period end</p>
            <p>• Reactivations restore full access immediately</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}