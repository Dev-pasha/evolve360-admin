'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiClient, Customer } from '@/lib/api-client'
import { formatDate, formatCurrency } from '@/lib/utils'
import { AlertTriangle, Eye, Clock, CreditCard, Users } from 'lucide-react'

export default function AtRiskCustomers() {
  const [atRiskCustomers, setAtRiskCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchAtRiskCustomers()
  }, [])

  const fetchAtRiskCustomers = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getAtRiskCustomers()
      if (response.status === 'success') {
        setAtRiskCustomers(response.data)
      } else {
        setError(response.message || 'Failed to fetch at-risk customers')
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevel = (customer: Customer) => {
    if (!customer.subscription) return 'low'
    
    const endDate = new Date(customer.subscription.endDate)
    const now = new Date()
    const daysUntilEnd = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (customer.subscription.status === 'past_due') return 'critical'
    if (daysUntilEnd <= 3) return 'high'
    if (daysUntilEnd <= 7) return 'medium'
    return 'low'
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  if (loading) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-orange-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-orange-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Error Loading At-Risk Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button variant="outline" onClick={fetchAtRiskCustomers}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (atRiskCustomers.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            No At-Risk Customers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700">Great! All customers are in good standing.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800 flex items-center justify-between">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            At-Risk Customers ({atRiskCustomers.length})
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchAtRiskCustomers}
            className="text-orange-600 border-orange-300 hover:bg-orange-100"
          >
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {atRiskCustomers.map((customer) => {
            const riskLevel = getRiskLevel(customer)
            const riskColor = getRiskColor(riskLevel)
            
            return (
              <div key={customer.id} className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {customer.firstName?.charAt(0) || customer.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{customer.fullName}</h3>
                      <p className="text-sm text-gray-600">{customer.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${riskColor}`}>
                        {riskLevel.toUpperCase()} RISK
                      </span>
                      {customer.subscription && (
                        <p className="text-xs text-gray-500 mt-1">
                          {customer.subscription.status === 'past_due' 
                            ? 'Past Due' 
                            : `Ends: ${formatDate(customer.subscription.endDate)}`
                          }
                        </p>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/customers/${customer.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
                
                {customer.subscription && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center text-gray-600">
                          <CreditCard className="h-4 w-4 mr-1" />
                          {customer.subscription.planName}
                        </span>
                        <span className="flex items-center text-gray-600">
                          <Users className="h-4 w-4 mr-1" />
                          {customer.groupsCount} groups
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(customer.subscription.price)}/{customer.subscription.billingCycle}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          
          {atRiskCustomers.length > 5 && (
            <div className="text-center pt-3 border-t border-orange-200">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push('/customers?filter=at-risk')}
                className="text-orange-600 border-orange-300 hover:bg-orange-100"
              >
                View All At-Risk Customers ({atRiskCustomers.length})
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}