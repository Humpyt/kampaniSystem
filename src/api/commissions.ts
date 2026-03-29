import { getAuthToken } from '../store/authStore';

const API_BASE = 'http://localhost:3000/api';

const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export interface CommissionArchive {
  id: string;
  user_id: string;
  user_name: string;
  user_email?: string;
  year: number;
  month: number;
  total_sales: number;
  commission_rate: number;
  commission_amount: number;
  status: 'pending' | 'paid';
  archived_at: string;
  paid_at?: string;
  created_by?: string;
}

export interface CommissionArchivesResponse {
  archives: CommissionArchive[];
  totals: {
    count: number;
    total_commissions: number;
    total_sales: number;
    paid_count: number;
    pending_count: number;
  };
  limit: number;
  offset: number;
}

export interface StaffCommission {
  user_id: string;
  user_name: string;
  total_sales: number;
  commission_rate: number;
  commission_amount: number;
  year?: number;
  month?: number;
}

export interface CommissionTrends {
  month: string;
  year: number;
  monthNum: number;
  totalCommissions: number;
  staffCount: number;
  topPerformer: {
    userId: string;
    userName: string;
    commissionAmount: number;
  } | null;
}

export interface CommissionTrendsResponse {
  trends: CommissionTrends[];
  averageMonthlyCommission: number;
}

export interface ArchiveCommissionsResponse {
  success: boolean;
  archivedCount: number;
  year: number;
  month: number;
  archives: Array<{
    userId: string;
    userName: string;
    totalSales: number;
    commissionRate: number;
    commissionAmount: number;
  }>;
}

export const getCommissionArchives = async (filters?: {
  year?: number;
  month?: number;
  status?: 'pending' | 'paid';
  userId?: string;
  limit?: number;
  offset?: number;
}): Promise<CommissionArchivesResponse> => {
  const params = new URLSearchParams();
  if (filters?.year) params.append('year', filters.year.toString());
  if (filters?.month) params.append('month', filters.month.toString());
  if (filters?.status) params.append('status', filters.status);
  if (filters?.userId) params.append('userId', filters.userId);
  if (filters?.limit !== undefined) params.append('limit', filters.limit.toString());
  if (filters?.offset !== undefined) params.append('offset', filters.offset.toString());

  const response = await fetch(`${API_BASE}/business/commissions/archives?${params.toString()}`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch commission archives');
  }

  return response.json();
};

export const getCommissionByStaff = async (year?: number, month?: number): Promise<{ staff: StaffCommission[] }> => {
  const params = new URLSearchParams();
  if (year) params.append('year', year.toString());
  if (month) params.append('month', month.toString());

  const response = await fetch(`${API_BASE}/business/commissions/by-staff?${params.toString()}`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch commission by staff');
  }

  return response.json();
};

export const getCommissionTrends = async (months: number = 6): Promise<CommissionTrendsResponse> => {
  const response = await fetch(`${API_BASE}/business/commissions/trends?months=${months}`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch commission trends');
  }

  return response.json();
};

export const archiveCommissions = async (year?: number, month?: number): Promise<ArchiveCommissionsResponse> => {
  const response = await fetch(`${API_BASE}/business/commissions/archive`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ year, month })
  });

  if (!response.ok) {
    throw new Error('Failed to archive commissions');
  }

  return response.json();
};

export const markCommissionPaid = async (archiveId: string): Promise<{ success: boolean; archive: CommissionArchive }> => {
  const response = await fetch(`${API_BASE}/business/commissions/${archiveId}/mark-paid`, {
    method: 'PATCH',
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to mark commission as paid');
  }

  return response.json();
};
