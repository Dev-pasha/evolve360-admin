'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/app/components/layout/layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiClient, DashboardData } from '@/lib/api-client'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Activity,
  UserCheck,
  UserX,
  Building2,
  Calendar,
  RefreshCw,
  AlertTriangle
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ElementType
  trend?: 'up' | 'down' | 'neutral'
  loading?: boolean
}

function StatCard({ title, value, change, icon: Icon, trend, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change !== undefined && (
              <div className={`flex items-center text-xs mt-1 ${
                trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : trend === 'down' ? (
                  <TrendingDown className="h-3 w-3 mr-1" />
                ) : null}
                {formatPercent(Math.abs(change))} from last month
              </div>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Icon className="h-6 w-6 text-gray-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RevenueChart({ data }: { data: Array<{ date: string; revenue: number; subscriptions: number }> }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No revenue data available</p>
        </div>
      </div>
    )
  }

  const maxRevenue = Math.max(...data.map(r => r.revenue))
  const chartData = data.slice(-30) // Show last 30 days

  return (
    <div className="space-y-4">
      <div className="h-64 flex items-end justify-between space-x-1 px-2">
        {chartData.map((item, index) => {
          const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
          return (
            <div key={index} className="flex flex-col items-center flex-1 group">
              <div 
                className="bg-blue-500 hover:bg-blue-600 w-full rounded-t transition-all cursor-pointer"
                style={{ height: `${Math.max(height, 2)}%` }}
                title={`${new Date(item.date).toLocaleDateString()}: ${formatCurrency(item.revenue)}`}
              />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-500 px-2">
        <span>{new Date(chartData[0]?.date).toLocaleDateString()}</span>
        <span>Revenue Trend (Last 30 Days)</span>
        <span>{new Date(chartData[chartData.length - 1]?.date).toLocaleDateString()}</span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError('')

      const response = await apiClient.getDashboard()
      if (response.status === 'success') {
        setDashboard(response.data)
      } else {
        setError(response.message || 'Failed to fetch dashboard data')
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Token expired, redirect to login
        router.push('/login')
        return
      }
      setError(error.response?.data?.message || 'An error occurred while loading dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    fetchDashboard(true)
  }

  if (loading) {
    return (
      <Layout>
        <div className="space-y-8">
          {/* Header Skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <StatCard key={i} title="" value="" icon={DollarSign} loading={true} />
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <Button onClick={() => fetchDashboard()} className="mr-4">
            Try Again
          </Button>
          <Button variant="outline" onClick={() => router.push('/settings')}>
            Go to Settings
          </Button>
        </div>
      </Layout>
    )
  }

  if (!dashboard) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No dashboard data available</p>
          <Button onClick={() => fetchDashboard()}>Load Dashboard</Button>
        </div>
      </Layout>
    )
  }

  const { overview, revenueChart, planAnalytics, growth } = dashboard

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Overview of your SaaS business performance</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Key Metrics Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(overview.totalRevenue)}
            icon={DollarSign}
            trend="up"
            change={12.5}
          />
          <StatCard
            title="Monthly Recurring Revenue"
            value={formatCurrency(overview.monthlyRecurringRevenue)}
            icon={TrendingUp}
            trend="up"
            change={8.2}
          />
          <StatCard
            title="Total Customers"
            value={overview.totalCustomers.toLocaleString()}
            icon={Users}
            trend="up"
            change={5.1}
          />
          <StatCard
            title="Active Subscriptions"
            value={overview.activeSubscriptions.toLocaleString()}
            icon={Activity}
            trend="up"
            change={3.7}
          />
        </div>

        {/* Key Metrics Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Annual Recurring Revenue"
            value={formatCurrency(overview.annualRecurringRevenue)}
            icon={Calendar}
          />
          <StatCard
            title="Average Revenue Per User"
            value={formatCurrency(overview.averageRevenuePerUser)}
            icon={UserCheck}
          />
          <StatCard
            title="Trial Subscriptions"
            value={overview.trialSubscriptions.toLocaleString()}
            icon={UserX}
            trend="neutral"
          />
          <StatCard
            title="Churn Rate"
            value={formatPercent(overview.churnRate)}
            icon={TrendingDown}
            trend="down"
            change={-1.2}
          />
        </div>

        {/* Growth Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Growth Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-green-600">+{growth.newSubscriptions}</p>
                <p className="text-sm text-gray-600">New Subscriptions</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-red-600">-{growth.canceledSubscriptions}</p>
                <p className="text-sm text-gray-600">Canceled Subscriptions</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-blue-600">+{growth.netGrowth}</p>
                <p className="text-sm text-gray-600">Net Growth</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{formatPercent(growth.growthRate)}</p>
                <p className="text-sm text-gray-600">Growth Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueChart data={revenueChart} />
            </CardContent>
          </Card>

          {/* Plan Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Plan Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {planAnalytics.map((plan, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <h3 className="font-medium text-gray-900">{plan.planName}</h3>
                      <p className="text-sm text-gray-600">{plan.activeCount} active customers</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(plan.revenue)}</p>
                      <p className="text-sm text-green-600">{formatPercent(plan.conversionRate)} conversion</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center hover:bg-blue-50"
                onClick={() => router.push('/customers')}
              >
                <Users className="h-6 w-6 mb-2" />
                View Customers
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center hover:bg-green-50"
                onClick={() => router.push('/analytics')}
              >
                <TrendingUp className="h-6 w-6 mb-2" />
                Analytics
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center hover:bg-purple-50"
                onClick={() => router.push('/settings')}
              >
                <Building2 className="h-6 w-6 mb-2" />
                Settings
              </Button>
            </div>
          </CardContent>

        </Card>        
      </div>
    </Layout>
  )
}