import axios, { AxiosInstance, AxiosResponse } from "axios";

export interface TrialStats {
  expiringSoon: number;
  expiredToday: number;
  expiredThisWeek: number;
  expiredThisMonth: number;
}

export interface JobStatus {
  isRunning: boolean;
  nextRun: string;
  lastRun: string | null;
  isScheduled: boolean;
}

export interface ProcessedSubscription {
  subscriptionId: number;
  customerEmail: string;
  previousStatus: string;
  newStatus: string;
  planName: string;
}

export interface ProcessingResult {
  processedCount: number;
  expiredToActive: number;
  expiredToExpired: number;
  errors: string[];
  processedSubscriptions: ProcessedSubscription[];
}

export interface Plan {
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
  isCustom: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  analytics: {
    activeSubscriptions: number;
    trialSubscriptions: number;
    monthlyRevenue: number;
    totalSubscriptions: number;
    annualRevenue?: number;
  };
  recentCustomers?: Array<{
    customerId: number;
    customerEmail: string;
    customerName: string;
    subscriptionStatus: string;
    startDate: string;
    endDate: string;
  }>;
}

export interface ApiResponse<T = any> {
  status: "success" | "error";
  data: T;
  message: string;
  error?: any;
  timestamp?: string;
}

export interface SaasOwner {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  fullName: string;
  isActive?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardData {
  overview: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    annualRecurringRevenue: number;
    totalCustomers: number;
    activeSubscriptions: number;
    trialSubscriptions: number;
    churnRate: number;
    averageRevenuePerUser: number;
    totalGroups: number;
    totalUsers: number;
  };
  revenueChart: Array<{
    date: string;
    revenue: number;
    subscriptions: number;
  }>;
  planAnalytics: Array<{
    planName: string;
    activeCount: number;
    revenue: number;
    conversionRate: number;
  }>;
  growth: {
    newSubscriptions: number;
    canceledSubscriptions: number;
    netGrowth: number;
    growthRate: number;
  };
}

export interface Customer {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  emailVerified: boolean;
  lastLoginAt: string;
  createdAt: string;
  subscription?: {
    id: number;
    status: string;
    planName: string;
    price: number;
    billingCycle: string;
    startDate: string;
    endDate: string;
  };
  groupsCount: number;
  groups: Array<{
    id: number;
    name: string;
  }>;
  totalRevenue?: number;
}

export interface CustomerDetails extends Customer {
  subscription: {
    id: number;
    status: string;
    plan: {
      id: number;
      name: string;
      price: number;
      billingCycle: string;
      maxGroups: number;
      maxUsersPerGroup: number;
      maxPlayersPerGroup: number;
    };
    startDate: string;
    endDate: string;
    trialEndDate?: string;
  };
  subscriptionHistory: Array<{
    id: number;
    status: string;
    planName: string;
    startDate: string;
    endDate: string;
    createdAt: string;
  }>;
  invoiceHistory: Array<{
    id: number;
    amount: number;
    status: string;
    dueDate: string;
    paidDate?: string;
    createdAt: string;
  }>;
}

export interface PaginatedResponse<T> {
  customers?: T[];
  data?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class SaasOwnerAPI {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: "/api/v1",
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.logout();
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    );

    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("saasOwnerToken");
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== "undefined") {
      localStorage.setItem("saasOwnerToken", token);
    }
  }

  logout() {
    this.token = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem("saasOwnerToken");
      localStorage.removeItem("saasOwner");
    }
  }

  // Bootstrap endpoints
  async checkBootstrap(): Promise<ApiResponse<{ exists: boolean }>> {
    const response = await this.client.get("/bootstrap/check");
    return response.data;
  }

  async createSaasOwner(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
  }): Promise<ApiResponse<SaasOwner>> {
    const response = await this.client.post(
      "/bootstrap/create-saas-owner",
      data
    );
    return response.data;
  }

  // Authentication
  async login(
    email: string,
    password: string
  ): Promise<ApiResponse<{ token: string; owner: SaasOwner }>> {
    const response = await this.client.post("/saas/auth/login", {
      email,
      password,
    });
    const result = response.data;

    if (result.status === "success" && result.data.token) {
      this.setToken(result.data.token);
      if (typeof window !== "undefined") {
        localStorage.setItem("saasOwner", JSON.stringify(result.data.owner));
      }
    }

    return result;
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    const response = await this.client.post("/saas/forgot-password", { email });
    return response.data;
  }

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<ApiResponse> {
    const response = await this.client.post("/saas/reset-password", {
      token,
      newPassword,
    });
    return response.data;
  }

  // Profile management
  async getProfile(): Promise<ApiResponse<SaasOwner>> {
    const response = await this.client.get("/saas/profile");
    return response.data;
  }

  async updateProfile(
    data: Partial<SaasOwner>
  ): Promise<ApiResponse<SaasOwner>> {
    const response = await this.client.patch("/saas/profile", data);
    return response.data;
  }

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse> {
    const response = await this.client.post("/saas/change-password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  async changeEmail(
    password: string,
    newEmail: string
  ): Promise<ApiResponse<SaasOwner>> {
    const response = await this.client.post("/saas/change-email", {
      password,
      newEmail,
    });
    return response.data;
  }

  async getAccountStats(): Promise<
    ApiResponse<{
      lastLoginAt: string;
      accountCreated: string;
      isActive: boolean;
      daysSinceCreation: number;
    }>
  > {
    const response = await this.client.get("/saas/stats");
    return response.data;
  }

  // Dashboard
  async getDashboard(): Promise<ApiResponse<DashboardData>> {
    const response = await this.client.get("/saas/dashboard");
    return response.data;
  }

  // Customer management
  async getCustomers(
    page = 1,
    limit = 20,
    search = ""
  ): Promise<ApiResponse<PaginatedResponse<Customer>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });
    const response = await this.client.get(`/saas/customers?${params}`);
    return response.data;
  }

  async getCustomerDetails(
    customerId: number
  ): Promise<ApiResponse<CustomerDetails>> {
    const response = await this.client.get(`/saas/customers/${customerId}`);
    return response.data;
  }

  async getAtRiskCustomers(): Promise<ApiResponse<Customer[]>> {
    const response = await this.client.get("/saas/customers/at-risk");
    return response.data;
  }

  async updateCustomerSubscription(
    customerId: number,
    action: "upgrade" | "downgrade" | "cancel" | "reactivate",
    planId?: number
  ): Promise<ApiResponse> {
    const response = await this.client.patch(
      `/saas/customers/${customerId}/subscription`,
      {
        action,
        ...(planId && { planId }),
      }
    );
    return response.data;
  }

  // Analytics
  async getAnalytics(
    type: "revenue" | "customers" | "usage" | "growth" = "revenue",
    period: "7d" | "30d" | "90d" | "1y" = "30d"
  ): Promise<ApiResponse> {
    const params = new URLSearchParams({ type, period });
    const response = await this.client.get(`/saas/analytics?${params}`);
    return response.data;
  }

  async getUsageAnalytics(): Promise<ApiResponse> {
    const response = await this.client.get("/saas/analytics/usage");
    return response.data;
  }

  // Plan Management
  async getPlans(): Promise<ApiResponse<Plan[]>> {
    const response = await this.client.get("/saas/plans");
    return response.data;
  }

  async getPlanDetails(planId: number): Promise<ApiResponse<Plan>> {
    const response = await this.client.get(`/saas/plans/${planId}`);
    return response.data;
  }

  async createPlan(planData: {
    name: string;
    description?: string;
    price: number;
    billing_cycle: "monthly" | "quarterly" | "annual";
    max_groups: number;
    max_users_per_group: number;
    max_players_per_group: number;
    is_custom?: boolean;
  }): Promise<ApiResponse<Plan>> {
    const response = await this.client.post("/saas/plans", planData);
    return response.data;
  }

  async updatePlan(
    planId: number,
    updateData: Partial<{
      name: string;
      description: string;
      price: number;
      billing_cycle: "monthly" | "quarterly" | "annual";
      max_groups: number;
      max_users_per_group: number;
      max_players_per_group: number;
      is_active: boolean;
    }>
  ): Promise<ApiResponse<Plan>> {
    const response = await this.client.patch(
      `/saas/plans/${planId}`,
      updateData
    );
    return response.data;
  }

  async deactivatePlan(planId: number): Promise<ApiResponse> {
    const response = await this.client.delete(`/saas/plans/${planId}`);
    return response.data;
  }

  // Enhanced Customer Management
  async createCustomer(customerData: {
    email: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    planId?: number;
    trialDays?: number;
    sendWelcomeEmail?: boolean;
    customNotes?: string;
  }): Promise<
    ApiResponse<{
      customer: Customer;
      subscription?: any;
      temporaryPassword?: string;
      welcomeEmailSent?: boolean;
    }>
  > {
    const response = await this.client.post(
      "/saas/customers/create",
      customerData
    );
    return response.data;
  }

  async assignPlanToCustomer(
    customerId: number,
    planData: {
      planId: number;
      trialDays?: number;
      startDate?: string;
      customPricing?: number;
      adminNotes?: string;
      cancelExisting?: boolean;
    }
  ): Promise<ApiResponse> {
    const response = await this.client.post(
      `/saas/customers/${customerId}/assign-plan`,
      planData
    );
    return response.data;
  }

  async updateCustomer(
    customerId: number,
    updateData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      emailVerified?: boolean;
      isActive?: boolean;
    }
  ): Promise<ApiResponse<Customer>> {
    const response = await this.client.patch(
      `/saas/customers/${customerId}`,
      updateData
    );
    return response.data;
  }

  async sendPasswordReset(customerId: number): Promise<ApiResponse> {
    const response = await this.client.post(
      `/saas/customers/${customerId}/reset-password`
    );
    return response.data;
  }

  async deactivateCustomer(
    customerId: number,
    reason?: string
  ): Promise<ApiResponse> {
    const response = await this.client.post(
      `/saas/customers/${customerId}/deactivate`,
      { reason }
    );
    return response.data;
  }

  async reactivateCustomer(customerId: number): Promise<ApiResponse> {
    const response = await this.client.post(
      `/saas/customers/${customerId}/reactivate`
    );
    return response.data;
  }

  // Custom Plan Management
  async createCustomPlan(
    customerId: number,
    planData: {
      planName: string;
      description?: string;
      customPricing: number;
      billingCycle: "monthly" | "quarterly" | "annual";
      customLimits: {
        maxGroups: number;
        maxUsersPerGroup: number;
        maxPlayersPerGroup: number;
      };
      trialDays?: number;
      adminNotes?: string;
      cancelExistingSubscription?: boolean;
    }
  ): Promise<ApiResponse> {
    const response = await this.client.post(
      `/saas/customers/${customerId}/create-custom-plan`,
      planData
    );
    return response.data;
  }

  async modifyCustomPlanLimits(
    planId: number,
    modifications: {
      newPricing?: number;
      newLimits?: {
        maxGroups?: number;
        maxUsersPerGroup?: number;
        maxPlayersPerGroup?: number;
      };
      adminNotes?: string;
      applyImmediately?: boolean;
    }
  ): Promise<ApiResponse> {
    const response = await this.client.patch(
      `/saas/plans/${planId}/modify-limits`,
      modifications
    );
    return response.data;
  }

  async getCustomPlanDetails(planId: number): Promise<ApiResponse> {
    const response = await this.client.get(
      `/saas/plans/${planId}/custom-details`
    );
    return response.data;
  }

  async getCustomerCustomPlan(customerId: number): Promise<ApiResponse> {
    const response = await this.client.get(
      `/saas/customers/${customerId}/custom-plan`
    );
    return response.data;
  }

  async convertToCustomPlan(
    customerId: number,
    conversionData: {
      customPlanName: string;
      customPricing?: number;
      customLimits?: {
        maxGroups?: number;
        maxUsersPerGroup?: number;
        maxPlayersPerGroup?: number;
      };
      adminNotes?: string;
      keepCurrentBillingCycle?: boolean;
    }
  ): Promise<ApiResponse> {
    const response = await this.client.post(
      `/saas/customers/${customerId}/convert-to-custom`,
      conversionData
    );
    return response.data;
  }

  async previewPlanConversion(customerId: number): Promise<ApiResponse> {
    const response = await this.client.get(
      `/saas/customers/${customerId}/plan-conversion-preview`
    );
    return response.data;
  }

  async getAllCustomPlans(): Promise<ApiResponse> {
    const response = await this.client.get("/saas/plans/custom");
    return response.data;
  }

  async deleteCustomPlan(planId: number): Promise<ApiResponse> {
    const response = await this.client.delete(`/saas/plans/${planId}/custom`);
    return response.data;
  }

  async getTrialExpirationStatus() {
    const response = await this.client.get("/trial-expiration/status");
    return response.data;
  }

  async getTrialExpirationStats() {
    const response = await this.client.get("/trial-expiration/stats");
    return response.data;
  }

  async triggerTrialExpiration(dryRun: boolean = false) {
    const response = await this.client.post("/trial-expiration/trigger", {
      dryRun,
    });
    return response.data;
  }

  async processExpiredTrials() {
    const response = await this.client.post("/trial-expiration/process");
    return response.data;
  }

  // Additional helper methods for better UX
  async previewTrialExpiration() {
    return this.triggerTrialExpiration(true);
  }

  async executeTrialExpiration() {
    return this.triggerTrialExpiration(false);
  }
}

export const apiClient = new SaasOwnerAPI();
