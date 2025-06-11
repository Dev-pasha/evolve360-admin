'use client'

import { useState, useEffect } from 'react'
import Layout from '@/app/components/layout/layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api-client'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { TrendingUp, Calendar, DollarSign, Users, BarChart3, PieChart } from 'lucide-react'

type Period = '7d' | '30d' | '90d' | '1y'
type AnalyticsType = 'revenue' | 'customers' | 'usage' | 'growth'

interface RevenueData {
  revenueOverTime: Array<{
    date: string
    revenue: number
    subscriptions: number
  }>
  paymentMetrics: {
    failedInvoices: number
    overdueInvoices: number
    totalInvoices: number
    failureRate: number
  }
}

interface UsageData {
  groupsPerPlan: Array<{
    planName: string
    groupCount: number
    maxAllowed: number
    utilizationRate: number
  }>
  usersPerGroup: {
    average: number
    maximum: number
    minimum: number
  }
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<RevenueData | null>(null)
  const [usageAnalytics, setUsageAnalytics] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('30d')
  const [selectedType, setSelectedType] = useState<AnalyticsType>('revenue')

  const periods = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
  ]

  const analyticsTypes = [
    { value: 'revenue', label: 'Revenue', icon: DollarSign },
    { value: 'customers', label: 'Customers', icon: Users },
    { value: 'usage', label: 'Usage', icon: BarChart3 },
    { value: 'growth', label: 'Growth', icon: TrendingUp },
  ]

  useEffect(() => {
    fetchAnalytics()
    if (selectedType === 'usage') {
      fetchUsageAnalytics()
    }
  }, [selectedPeriod, selectedType])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getAnalytics(selectedType, selectedPeriod)
      if (response.status === 'success') {
        setAnalytics(response.data)
      } else {
        setError(response.message || 'Failed to fetch analytics')
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsageAnalytics = async () => {
    try {
      const response = await apiClient.getUsageAnalytics()
      if (response.status === 'success') {
        setUsageAnalytics(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch usage analytics:', error)
    }
  }

  const renderRevenueChart = () => {
    if (!analytics?.revenueOverTime) return null

    const maxRevenue = Math.max(...analytics.revenueOverTime.map(r => r.revenue))
    
    return (
      <div className="h-64 flex items-end justify-between space-x-1 px-4">
        {analytics.revenueOverTime.slice(-30).map((item, index) => {
          const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
          return (
            <div key={index} className="flex flex-col items-center flex-1 group">
              <div 
                className="bg-blue-500 hover:bg-blue-600 w-full rounded-t transition-colors cursor-pointer"
                style={{ height: `${Math.max(height, 2)}%` }}
                title={`${new Date(item.date).toLocaleDateString()}: ${formatCurrency(item.revenue)}`}
              />
            </div>
          )
        })}
      </div>
    )
  }

  const renderUsageChart = () => {
    if (!usageAnalytics?.groupsPerPlan) return null

    return (
      <div className="space-y-4">
        {usageAnalytics.groupsPerPlan.map((plan, index) => (
          <div key={index} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">{plan.planName}</h3>
              <span className="text-sm text-gray-600">
                {plan.groupCount} / {plan.maxAllowed} groups
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${plan.utilizationRate}%` }}
              />
            </div>
            <div className="mt-1 text-right">
              <span className="text-sm font-medium">{plan.utilizationRate}% utilized</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderPlaceholderChart = (type: string) => (
    <div className="text-center py-12">
      <PieChart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <p className="text-gray-600">
        {type.charAt(0).toUpperCase() + type.slice(1)} analytics coming soon...
      </p>
      <p className="text-sm text-gray-500 mt-2">
        This feature will be available in a future update
      </p>
    </div>
  )

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Detailed insights into your business performance</p>
        </div>

        {/* Controls */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {analyticsTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <Button
                      key={type.value}
                      variant={selectedType === type.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedType(type.value as AnalyticsType)}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {type.label}
                    </Button>
                  )
                })}
              </div>
              
              <div className="flex gap-2">
                {periods.map((period) => (
                  <Button
                    key={period.value}
                    variant={selectedPeriod === period.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPeriod(period.value as Period)}
                  >
                    {period.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchAnalytics}>Try Again</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Revenue Analytics */}
            {selectedType === 'revenue' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Revenue Over Time ({selectedPeriod})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics?.revenueOverTime ? (
                      <>
                        {renderRevenueChart()}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">
                              {formatCurrency(analytics.revenueOverTime.reduce((sum, item) => sum + item.revenue, 0))}
                            </p>
                            <p className="text-sm text-gray-600">Total Revenue</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">
                              {analytics.revenueOverTime.reduce((sum, item) => sum + item.subscriptions, 0)}
                            </p>
                            <p className="text-sm text-gray-600">Total Subscriptions</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      renderPlaceholderChart('revenue')
                    )}
                  </CardContent>
                </Card>

                {/* Payment Metrics */}
                {analytics?.paymentMetrics && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                      <CardContent className="p-6 text-center">
                        <p className="text-2xl font-bold text-red-600">{analytics.paymentMetrics.failedInvoices}</p>
                        <p className="text-sm text-gray-600">Failed Invoices</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6 text-center">
                        <p className="text-2xl font-bold text-yellow-600">{analytics.paymentMetrics.overdueInvoices}</p>
                        <p className="text-sm text-gray-600">Overdue Invoices</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6 text-center">
                        <p className="text-2xl font-bold text-blue-600">{analytics.paymentMetrics.totalInvoices}</p>
                        <p className="text-sm text-gray-600">Total Invoices</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6 text-center">
                        <p className="text-2xl font-bold text-purple-600">
                          {formatPercent(analytics.paymentMetrics.failureRate)}
                        </p>
                        <p className="text-sm text-gray-600">Failure Rate</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            )}

            {/* Usage Analytics */}
            {selectedType === 'usage' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Plan Utilization
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {usageAnalytics?.groupsPerPlan ? renderUsageChart() : renderPlaceholderChart('usage')}
                  </CardContent>
                </Card>

                {usageAnalytics?.usersPerGroup && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Users Per Group Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 border rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">
                            {usageAnalytics.usersPerGroup.average.toFixed(1)}
                          </p>
                          <p className="text-sm text-gray-600">Average Users</p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <p className="text-2xl font-bold text-green-600">
                            {usageAnalytics.usersPerGroup.maximum}
                          </p>
                          <p className="text-sm text-gray-600">Maximum Users</p>
                        </div>
                        <div className="text-center p-4 border rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">
                            {usageAnalytics.usersPerGroup.minimum}
                          </p>
                          <p className="text-sm text-gray-600">Minimum Users</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Placeholder for other analytics types */}
            {(selectedType === 'customers' || selectedType === 'growth') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {selectedType === 'customers' ? (
                      <Users className="h-5 w-5 mr-2" />
                    ) : (
                      <TrendingUp className="h-5 w-5 mr-2" />
                    )}
                    {analyticsTypes.find(t => t.value === selectedType)?.label} Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderPlaceholderChart(selectedType)}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}