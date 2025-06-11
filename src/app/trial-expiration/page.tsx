"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/app/components/layout/layout";
import { apiClient } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Play,
  Eye,
  RefreshCw,
  Activity,
  Users,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

// Types
interface TrialStats {
  expiringSoon: number;
  expiredToday: number;
  expiredThisWeek: number;
  expiredThisMonth: number;
}

interface JobStatus {
  isRunning: boolean;
  nextRun: string;
  lastRun: string | null;
  isScheduled: boolean;
}

interface ProcessedSubscription {
  subscriptionId: number;
  customerEmail: string;
  previousStatus: string;
  newStatus: string;
  planName: string;
}

interface ProcessingResult {
  processedCount: number;
  expiredToActive: number;
  expiredToExpired: number;
  errors: string[];
  processedSubscriptions: ProcessedSubscription[];
}

interface ProcessingResponse {
  success: boolean;
  message: string;
  data: {
    result: ProcessingResult;
    summary: {
      totalProcessed: number;
      convertedToActive: number;
      expired: number;
      errors: number;
      isDryRun: boolean;
    };
  };
}

const TrialExpirationPage = () => {
  const [stats, setStats] = useState<TrialStats | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ProcessingResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [isDryRun, setIsDryRun] = useState(false);


  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.getTrialExpirationStatus();

      if (response.data.success) {
        setStats(response.data.data.stats);
        setJobStatus(response.data.data.status);
      } else {
        // throw new Error(response.data.message);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch trial status"
      );
      console.error("Error fetching trial status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      setProcessing(true);
      setError(null);
      setIsDryRun(true);

      const response = await apiClient.triggerTrialExpiration(true)

      if (response.data.success) {
        setLastResult(response.data.data.result);
        setShowResultModal(true);
      } else {
        // throw new Error(response.data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleProcess = async () => {
    try {
      setProcessing(true);
      setError(null);
      setIsDryRun(false);

      const response = await apiClient.triggerTrialExpiration(false)

      if (response.data.success) {
        setLastResult(response.data.data.result);
        setShowResultModal(true);
        // Refresh stats after processing
        setTimeout(fetchStatus, 1000);
      } else {
        // throw new Error(response.data.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: {
        variant: "default" as const,
        className: "bg-green-100 text-green-800",
      },
      EXPIRED: {
        variant: "destructive" as const,
        className: "bg-red-100 text-red-800",
      },
      TRIAL: {
        variant: "secondary" as const,
        className: "bg-blue-100 text-blue-800",
      },
      DRY_RUN: {
        variant: "outline" as const,
        className: "bg-gray-100 text-gray-800",
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.TRIAL;
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  useEffect(() => {
    fetchStatus();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <Layout>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Loading trial expiration data...
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Trial Expiration Management
          </h1>
          <p className="text-gray-600">
            Monitor and manage trial subscription expirations
          </p>
        </div>

        {error && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Job Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Cron Job Status
                </CardTitle>
                <CardDescription>
                  Automated trial processing runs daily at 12:00 AM UTC
                </CardDescription>
              </div>
              <Badge
                variant={jobStatus?.isScheduled ? "default" : "destructive"}
                className={
                  jobStatus?.isScheduled ? "bg-green-100 text-green-800" : ""
                }
              >
                {jobStatus?.isScheduled ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Next Run</p>
                <p className="text-sm text-gray-600">
                  {jobStatus?.nextRun || "Not scheduled"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Last Run</p>
                <p className="text-sm text-gray-600">
                  {jobStatus?.lastRun
                    ? new Date(jobStatus.lastRun).toLocaleString()
                    : "Never"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Current Status</p>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      jobStatus?.isRunning
                        ? "bg-green-500 animate-pulse"
                        : "bg-gray-300"
                    }`}
                  />
                  <p className="text-sm text-gray-600">
                    {jobStatus?.isRunning ? "Running" : "Idle"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-amber-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">
                    {stats?.expiringSoon || 0}
                  </p>
                  <p className="text-sm text-gray-600">Expiring Soon</p>
                  <p className="text-xs text-gray-500">Next 3 days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">
                    {stats?.expiredToday || 0}
                  </p>
                  <p className="text-sm text-gray-600">Processed Today</p>
                  <p className="text-xs text-gray-500">Completed trials</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">
                    {stats?.expiredThisWeek || 0}
                  </p>
                  <p className="text-sm text-gray-600">This Week</p>
                  <p className="text-xs text-gray-500">7 days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold">
                    {stats?.expiredThisMonth || 0}
                  </p>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-xs text-gray-500">30 days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Manual Processing Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manual Processing
            </CardTitle>
            <CardDescription>
              Manually trigger trial expiration processing outside of scheduled
              runs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handlePreview}
                disabled={processing}
                className="flex items-center gap-2"
              >
                {processing && isDryRun ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                Preview Changes
              </Button>

              <Button
                onClick={handleProcess}
                disabled={processing}
                className="flex items-center gap-2"
              >
                {processing && !isDryRun ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Process Now
              </Button>

              <Button
                variant="ghost"
                onClick={fetchStatus}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Modal */}
        <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isDryRun ? "Preview Results" : "Processing Results"}
              </DialogTitle>
              <DialogDescription>
                {isDryRun
                  ? "These changes would be made if you proceed with processing"
                  : "Trial expiration processing has been completed"}
              </DialogDescription>
            </DialogHeader>

            {lastResult && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold">
                        {lastResult.processedCount}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total Processed
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {lastResult.expiredToActive}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Converted to Active
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-amber-600">
                        {lastResult.expiredToExpired}
                      </p>
                      <p className="text-sm text-muted-foreground">Expired</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {lastResult.errors.length}
                      </p>
                      <p className="text-sm text-muted-foreground">Errors</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Errors */}
                {lastResult.errors.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Processing Errors:</strong>
                      <ul className="mt-2 list-disc list-inside">
                        {lastResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Processed Subscriptions Table */}
                {lastResult.processedSubscriptions.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-3">
                      Processed Subscriptions
                    </h4>
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subscription ID</TableHead>
                            <TableHead>Customer Email</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Previous Status</TableHead>
                            <TableHead>New Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lastResult.processedSubscriptions.map(
                            (subscription) => (
                              <TableRow key={subscription.subscriptionId}>
                                <TableCell className="font-mono">
                                  {subscription.subscriptionId}
                                </TableCell>
                                <TableCell>
                                  {subscription.customerEmail}
                                </TableCell>
                                <TableCell>{subscription.planName}</TableCell>
                                <TableCell>
                                  {getStatusBadge(subscription.previousStatus)}
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(subscription.newStatus)}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default TrialExpirationPage;
