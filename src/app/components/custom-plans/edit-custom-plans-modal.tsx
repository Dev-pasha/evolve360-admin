"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import {
  X,
  Crown,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface CustomPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  billingCycle: string;
  limits: {
    maxGroups: number;
    maxUsersPerGroup: number;
    maxPlayersPerGroup: number;
  };
  customer: {
    id: number;
    email: string;
    name: string;
    subscriptionStatus: string;
  };
}

interface EditCustomPlanModalProps {
  plan: CustomPlan;
  onClose: () => void;
  onSuccess: (
    modifications: any
  ) => Promise<{ success: boolean; error?: string }>;
}

interface PlanDetails {
  customPlanDetails: {
    currentUsage: {
      maxGroupsUsed: number;
      maxUsersPerGroupUsed: number;
      utilizationRates: {
        groups: string;
        usersPerGroup: string;
      };
    };
    canReduceLimits: {
      groups: boolean;
      usersPerGroup: boolean;
    };
  };
}

export default function EditCustomPlanModal({
  plan,
  onClose,
  onSuccess,
}: EditCustomPlanModalProps) {
  const [planDetails, setPlanDetails] = useState<PlanDetails | null>(null);
  const [formData, setFormData] = useState({
    newPricing: plan.price.toString(),
    newLimits: {
      maxGroups: plan.limits.maxGroups.toString(),
      maxUsersPerGroup: plan.limits.maxUsersPerGroup.toString(),
      maxPlayersPerGroup: plan.limits.maxPlayersPerGroup.toString(),
    },
    adminNotes: "",
    applyImmediately: true,
  });
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchPlanDetails();
  }, []);

  const fetchPlanDetails = async () => {
    try {
      setDetailsLoading(true);
      const response = await apiClient.getCustomPlanDetails(plan.id);
      if (response.status === "success") {
        setPlanDetails(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch plan details:", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (name.startsWith("newLimits.")) {
      const limitField = name.replace("newLimits.", "");
      setFormData((prev) => ({
        ...prev,
        newLimits: {
          ...prev.newLimits,
          [limitField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      }));
    }
  };

  const getChanges = () => {
    const changes: any = {};

    if (parseFloat(formData.newPricing) !== plan.price) {
      changes.newPricing = parseFloat(formData.newPricing);
    }

    const limitsChanged =
      parseInt(formData.newLimits.maxGroups) !== plan.limits.maxGroups ||
      parseInt(formData.newLimits.maxUsersPerGroup) !==
        plan.limits.maxUsersPerGroup ||
      parseInt(formData.newLimits.maxPlayersPerGroup) !==
        plan.limits.maxPlayersPerGroup;

    if (limitsChanged) {
      changes.newLimits = {
        maxGroups: parseInt(formData.newLimits.maxGroups),
        maxUsersPerGroup: parseInt(formData.newLimits.maxUsersPerGroup),
        maxPlayersPerGroup: parseInt(formData.newLimits.maxPlayersPerGroup),
      };
    }

    if (formData.adminNotes.trim()) {
      changes.adminNotes = formData.adminNotes;
    }

    changes.applyImmediately = formData.applyImmediately;

    return changes;
  };

  const validateForm = () => {
    if (!formData.newPricing || parseFloat(formData.newPricing) < 0) {
      return "Pricing must be 0 or greater";
    }
    if (
      !formData.newLimits.maxGroups ||
      parseInt(formData.newLimits.maxGroups) <= 0
    ) {
      return "Max groups must be greater than 0";
    }
    if (
      !formData.newLimits.maxUsersPerGroup ||
      parseInt(formData.newLimits.maxUsersPerGroup) <= 0
    ) {
      return "Max users per group must be greater than 0";
    }
    if (
      !formData.newLimits.maxPlayersPerGroup ||
      parseInt(formData.newLimits.maxPlayersPerGroup) <= 0
    ) {
      return "Max players per group must be greater than 0";
    }

    // Check against current usage
    if (planDetails) {
      const newGroups = parseInt(formData.newLimits.maxGroups);
      const newUsersPerGroup = parseInt(formData.newLimits.maxUsersPerGroup);

      if (
        newGroups < planDetails.customPlanDetails.currentUsage.maxGroupsUsed
      ) {
        return `Cannot reduce groups to ${newGroups}. Customer is using ${planDetails.customPlanDetails.currentUsage.maxGroupsUsed} groups.`;
      }

      if (
        newUsersPerGroup <
        planDetails.customPlanDetails.currentUsage.maxUsersPerGroupUsed
      ) {
        return `Cannot reduce users per group to ${newUsersPerGroup}. Some groups have ${planDetails.customPlanDetails.currentUsage.maxUsersPerGroupUsed} users.`;
      }
    }

    const changes = getChanges();
    if (Object.keys(changes).length <= 1) {
      // Only applyImmediately
      return "No changes detected";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const modifications = getChanges();
      const result = await onSuccess(modifications);

      if (result.success) {
        setSuccess("Custom plan modified successfully!");
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.error || "Failed to modify custom plan");
      }
    } catch (error: any) {
      setError(error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const renderChangeIndicator = (
    currentValue: number | string,
    newValue: string,
    formatter?: (val: number) => string
  ) => {
    const current =
      typeof currentValue === "string"
        ? parseFloat(currentValue)
        : currentValue;
    const newVal = parseFloat(newValue);

    if (current === newVal) return null;

    const isIncrease = newVal > current;
    const Icon = isIncrease ? TrendingUp : TrendingDown;
    const color = isIncrease ? "text-green-600" : "text-red-600";

    return (
      <div className={`flex items-center text-xs ${color} mt-1`}>
        <Icon className="h-3 w-3 mr-1" />
        {formatter ? formatter(current) : current} →{" "}
        {formatter ? formatter(newVal) : newVal}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle className="flex items-center">
            <Crown className="h-5 w-5 mr-2 text-yellow-500" />
            Edit Custom Plan: {plan.name}
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

          {/* Plan Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Plan Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Customer:</span>
                <span className="font-medium ml-1">{plan.customer.name}</span>
              </div>
              <div>
                <span className="text-blue-700">Status:</span>
                <span className="font-medium ml-1 capitalize">
                  {plan.customer.subscriptionStatus}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Current Price:</span>
                <span className="font-medium ml-1">
                  {formatCurrency(plan.price)}/{plan.billingCycle}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Current Limits:</span>
                <span className="font-medium ml-1">
                  {plan.limits.maxGroups} groups, {plan.limits.maxUsersPerGroup}{" "}
                  users/group
                </span>
              </div>
            </div>
          </div>

          {/* Current Usage */}
          {detailsLoading ? (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ) : (
            planDetails && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">
                  Current Usage
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-700">
                  <div>
                    <p>
                      Groups Used:{" "}
                      <span className="font-medium">
                        {
                          planDetails.customPlanDetails.currentUsage
                            .maxGroupsUsed
                        }
                      </span>{" "}
                      / {plan.limits.maxGroups}
                    </p>
                    <p>
                      Utilization:{" "}
                      <span className="font-medium">
                        {
                          planDetails.customPlanDetails.currentUsage
                            .utilizationRates.groups
                        }
                      </span>
                    </p>
                  </div>
                  <div>
                    <p>
                      Max Users/Group:{" "}
                      <span className="font-medium">
                        {
                          planDetails.customPlanDetails.currentUsage
                            .maxUsersPerGroupUsed
                        }
                      </span>{" "}
                      / {plan.limits.maxUsersPerGroup}
                    </p>
                    <p>
                      Utilization:{" "}
                      <span className="font-medium">
                        {
                          planDetails.customPlanDetails.currentUsage
                            .utilizationRates.usersPerGroup
                        }
                      </span>
                    </p>
                  </div>
                </div>
                <p className="text-xs text-yellow-600 mt-2">
                  ⚠️ Cannot reduce limits below current usage
                </p>
              </div>
            )
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Pricing</h3>

              <div className="space-y-2">
                <Label htmlFor="newPricing">New Pricing ($)</Label>
                <Input
                  id="newPricing"
                  name="newPricing"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100000"
                  value={formData.newPricing}
                  onChange={handleInputChange}
                  required
                />
                {renderChangeIndicator(
                  plan.price,
                  formData.newPricing,
                  formatCurrency
                )}
              </div>
            </div>

            {/* Limits */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Custom Limits</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newLimits.maxGroups">Max Groups</Label>
                  <Input
                    id="newLimits.maxGroups"
                    name="newLimits.maxGroups"
                    type="number"
                    min="1"
                    max="50000"
                    value={formData.newLimits.maxGroups}
                    onChange={handleInputChange}
                    required
                  />
                  {renderChangeIndicator(
                    plan.limits.maxGroups,
                    formData.newLimits.maxGroups
                  )}
                  {planDetails &&
                    !planDetails.customPlanDetails.canReduceLimits.groups && (
                      <p className="text-xs text-red-600">
                        Cannot reduce - customer using{" "}
                        {
                          planDetails.customPlanDetails.currentUsage
                            .maxGroupsUsed
                        }{" "}
                        groups
                      </p>
                    )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newLimits.maxUsersPerGroup">
                    Max Users per Group
                  </Label>
                  <Input
                    id="newLimits.maxUsersPerGroup"
                    name="newLimits.maxUsersPerGroup"
                    type="number"
                    min="1"
                    max="10000"
                    value={formData.newLimits.maxUsersPerGroup}
                    onChange={handleInputChange}
                    required
                  />
                  {renderChangeIndicator(
                    plan.limits.maxUsersPerGroup,
                    formData.newLimits.maxUsersPerGroup
                  )}
                  {planDetails &&
                    !planDetails.customPlanDetails.canReduceLimits
                      .usersPerGroup && (
                      <p className="text-xs text-red-600">
                        Cannot reduce - some groups have{" "}
                        {
                          planDetails.customPlanDetails.currentUsage
                            .maxUsersPerGroupUsed
                        }{" "}
                        users
                      </p>
                    )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newLimits.maxPlayersPerGroup">
                    Max Players per Group
                  </Label>
                  <Input
                    id="newLimits.maxPlayersPerGroup"
                    name="newLimits.maxPlayersPerGroup"
                    type="number"
                    min="1"
                    max="100000"
                    value={formData.newLimits.maxPlayersPerGroup}
                    onChange={handleInputChange}
                    required
                  />
                  {renderChangeIndicator(
                    plan.limits.maxPlayersPerGroup,
                    formData.newLimits.maxPlayersPerGroup
                  )}
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Modification Options</h3>

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
                    placeholder="Reason for this modification..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="applyImmediately"
                    name="applyImmediately"
                    checked={formData.applyImmediately}
                    onChange={handleInputChange}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="applyImmediately">
                    Apply changes immediately
                  </Label>
                </div>
              </div>
            </div>

            {/* Preview Changes */}
            {Object.keys(getChanges()).length > 1 && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-2">Change Summary</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {parseFloat(formData.newPricing) !== plan.price && (
                    <p>
                      • Pricing: {formatCurrency(plan.price)} →{" "}
                      {formatCurrency(parseFloat(formData.newPricing))}
                    </p>
                  )}
                  {parseInt(formData.newLimits.maxGroups) !==
                    plan.limits.maxGroups && (
                    <p>
                      • Max Groups: {plan.limits.maxGroups} →{" "}
                      {formData.newLimits.maxGroups}
                    </p>
                  )}
                  {parseInt(formData.newLimits.maxUsersPerGroup) !==
                    plan.limits.maxUsersPerGroup && (
                    <p>
                      • Max Users/Group: {plan.limits.maxUsersPerGroup} →{" "}
                      {formData.newLimits.maxUsersPerGroup}
                    </p>
                  )}
                  {parseInt(formData.newLimits.maxPlayersPerGroup) !==
                    plan.limits.maxPlayersPerGroup && (
                    <p>
                      • Max Players/Group: {plan.limits.maxPlayersPerGroup} →{" "}
                      {formData.newLimits.maxPlayersPerGroup}
                    </p>
                  )}
                  {formData.adminNotes.trim() && (
                    <p>• Admin Notes: {formData.adminNotes}</p>
                  )}
                  <p>
                    • Apply Immediately:{" "}
                    {formData.applyImmediately ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            )}
            <div className="mt-6">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
