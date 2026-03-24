export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  description: string;
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  type: 'string' | 'boolean' | 'number';
  category: 'general' | 'security' | 'notifications';
  description: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout';
  module: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}
