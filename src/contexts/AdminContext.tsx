import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { AdminUser, Role, Permission, SystemSetting, AuditLog } from '../types/admin';
import { v4 as uuidv4 } from 'uuid';

interface AdminContextType {
  // Users
  users: AdminUser[];
  addUser: (user: Omit<AdminUser, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, user: Partial<AdminUser>) => void;
  deleteUser: (id: string) => void;
  getUserById: (id: string) => AdminUser | undefined;
  
  // Roles
  roles: Role[];
  addRole: (role: Omit<Role, 'id' | 'createdAt'>) => void;
  updateRole: (id: string, role: Partial<Role>) => void;
  deleteRole: (id: string) => void;
  getRoleByName: (name: string) => Role | undefined;
  
  // Permissions
  permissions: Permission[];
  addPermission: (permission: Omit<Permission, 'id'>) => void;
  updatePermission: (id: string, permission: Partial<Permission>) => void;
  deletePermission: (id: string) => void;
  
  // Settings
  settings: SystemSetting[];
  updateSetting: (id: string, value: string) => void;
  getSettingByKey: (key: string) => SystemSetting | undefined;
  
  // Audit Logs
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  clearAuditLogs: () => void;
  getFilteredLogs: (startDate?: string, endDate?: string, action?: string) => AuditLog[];
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Enhanced mock data with more realistic values
const mockPermissions: Permission[] = [
  { id: '1', name: 'view_users', description: 'View users list', module: 'users' },
  { id: '2', name: 'manage_users', description: 'Create/Edit/Delete users', module: 'users' },
  { id: '3', name: 'view_roles', description: 'View roles list', module: 'roles' },
  { id: '4', name: 'manage_roles', description: 'Create/Edit/Delete roles', module: 'roles' },
  { id: '5', name: 'view_settings', description: 'View system settings', module: 'settings' },
  { id: '6', name: 'manage_settings', description: 'Modify system settings', module: 'settings' },
  { id: '7', name: 'view_audit_logs', description: 'View audit logs', module: 'audit' },
  { id: '8', name: 'manage_customers', description: 'Manage customer data', module: 'customers' },
  { id: '9', name: 'manage_orders', description: 'Manage repair orders', module: 'orders' },
  { id: '10', name: 'manage_inventory', description: 'Manage inventory and supplies', module: 'inventory' },
];

const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Admin',
    permissions: mockPermissions,
    description: 'Full system access',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Manager',
    permissions: mockPermissions.filter(p => p.name.startsWith('view') || p.name.includes('manage_customers') || p.name.includes('manage_orders')),
    description: 'Store management access',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Staff',
    permissions: mockPermissions.filter(p => p.name.startsWith('view') || p.name === 'manage_customers'),
    description: 'Basic staff access',
    createdAt: '2024-01-01T00:00:00Z',
  },
];

const mockUsers: AdminUser[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@repairpro.com',
    role: 'Admin',
    status: 'active',
    lastLogin: '2024-12-10T10:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Store Manager',
    email: 'manager@repairpro.com',
    role: 'Manager',
    status: 'active',
    lastLogin: '2024-12-10T09:30:00Z',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Staff Member',
    email: 'staff@repairpro.com',
    role: 'Staff',
    status: 'active',
    lastLogin: '2024-12-10T08:45:00Z',
    createdAt: '2024-01-01T00:00:00Z',
  },
];

const mockSettings: SystemSetting[] = [
  {
    id: '1',
    key: 'system_name',
    value: 'Repair PRO',
    type: 'string',
    category: 'general',
    description: 'System name displayed in the UI',
  },
  {
    id: '2',
    key: 'company_address',
    value: '123 Repair Street, City',
    type: 'string',
    category: 'general',
    description: 'Company address for receipts and documents',
  },
  {
    id: '3',
    key: 'require_2fa',
    value: 'false',
    type: 'boolean',
    category: 'security',
    description: 'Require two-factor authentication for admin users',
  },
  {
    id: '4',
    key: 'session_timeout',
    value: '30',
    type: 'number',
    category: 'security',
    description: 'Session timeout in minutes',
  },
  {
    id: '5',
    key: 'enable_notifications',
    value: 'true',
    type: 'boolean',
    category: 'general',
    description: 'Enable system notifications',
  },
];

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<AdminUser[]>(mockUsers);
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [permissions] = useState<Permission[]>(mockPermissions);
  const [settings, setSettings] = useState<SystemSetting[]>(mockSettings);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedUsers = localStorage.getItem('admin_users');
    const savedRoles = localStorage.getItem('admin_roles');
    const savedSettings = localStorage.getItem('admin_settings');
    const savedLogs = localStorage.getItem('admin_audit_logs');

    if (savedUsers) setUsers(JSON.parse(savedUsers));
    if (savedRoles) setRoles(JSON.parse(savedRoles));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    if (savedLogs) setAuditLogs(JSON.parse(savedLogs));
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('admin_users', JSON.stringify(users));
    localStorage.setItem('admin_roles', JSON.stringify(roles));
    localStorage.setItem('admin_settings', JSON.stringify(settings));
    localStorage.setItem('admin_audit_logs', JSON.stringify(auditLogs));
  }, [users, roles, settings, auditLogs]);

  const addUser = useCallback((user: Omit<AdminUser, 'id' | 'createdAt'>) => {
    const newUser = {
      ...user,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };
    setUsers(prev => [...prev, newUser]);
    addAuditLog({
      userId: '1',
      userName: 'Admin User',
      action: 'create',
      module: 'users',
      details: `Created user: ${user.name}`,
      ipAddress: '127.0.0.1',
    });
  }, []);

  const updateUser = useCallback((id: string, userData: Partial<AdminUser>) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, ...userData } : user
    ));
    addAuditLog({
      userId: '1',
      userName: 'Admin User',
      action: 'update',
      module: 'users',
      details: `Updated user: ${id}`,
      ipAddress: '127.0.0.1',
    });
  }, []);

  const deleteUser = useCallback((id: string) => {
    const user = users.find(u => u.id === id);
    setUsers(prev => prev.filter(user => user.id !== id));
    addAuditLog({
      userId: '1',
      userName: 'Admin User',
      action: 'delete',
      module: 'users',
      details: `Deleted user: ${user?.name || id}`,
      ipAddress: '127.0.0.1',
    });
  }, [users]);

  const getUserById = useCallback((id: string) => {
    return users.find(user => user.id === id);
  }, [users]);

  const addRole = useCallback((role: Omit<Role, 'id' | 'createdAt'>) => {
    const newRole = {
      ...role,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    setRoles(prev => [...prev, newRole]);
    addAuditLog({
      userId: '1',
      userName: 'Admin User',
      action: 'create',
      module: 'roles',
      details: `Created role: ${role.name}`,
      ipAddress: '127.0.0.1',
    });
  }, []);

  const updateRole = useCallback((id: string, roleData: Partial<Role>) => {
    setRoles(prev => prev.map(role => 
      role.id === id ? { ...role, ...roleData } : role
    ));
    addAuditLog({
      userId: '1',
      userName: 'Admin User',
      action: 'update',
      module: 'roles',
      details: `Updated role: ${id}`,
      ipAddress: '127.0.0.1',
    });
  }, []);

  const deleteRole = useCallback((id: string) => {
    const role = roles.find(r => r.id === id);
    setRoles(prev => prev.filter(role => role.id !== id));
    addAuditLog({
      userId: '1',
      userName: 'Admin User',
      action: 'delete',
      module: 'roles',
      details: `Deleted role: ${role?.name || id}`,
      ipAddress: '127.0.0.1',
    });
  }, [roles]);

  const getRoleByName = useCallback((name: string) => {
    return roles.find(role => role.name === name);
  }, [roles]);

  const addPermission = useCallback((permission: Omit<Permission, 'id'>) => {
    const newPermission = {
      ...permission,
      id: uuidv4(),
    };
    setRoles(prev => [...prev]);
  }, []);

  const updatePermission = useCallback((id: string, permissionData: Partial<Permission>) => {
    setRoles(prev => prev.map(permission => 
      permission.id === id ? { ...permission, ...permissionData } : permission
    ));
  }, []);

  const deletePermission = useCallback((id: string) => {
    setRoles(prev => prev.filter(permission => permission.id !== id));
  }, []);

  const updateSetting = useCallback((id: string, value: string) => {
    setSettings(prev => prev.map(setting => 
      setting.id === id ? { ...setting, value } : setting
    ));
    addAuditLog({
      userId: '1',
      userName: 'Admin User',
      action: 'update',
      module: 'settings',
      details: `Updated setting: ${settings.find(s => s.id === id)?.key}`,
      ipAddress: '127.0.0.1',
    });
  }, [settings]);

  const getSettingByKey = useCallback((key: string) => {
    return settings.find(setting => setting.key === key);
  }, [settings]);

  const addAuditLog = useCallback((log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog = {
      ...log,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, []);

  const clearAuditLogs = useCallback(() => {
    setAuditLogs([]);
    addAuditLog({
      userId: '1',
      userName: 'Admin User',
      action: 'delete',
      module: 'audit',
      details: 'Cleared all audit logs',
      ipAddress: '127.0.0.1',
    });
  }, []);

  const getFilteredLogs = useCallback((startDate?: string, endDate?: string, action?: string) => {
    return auditLogs.filter(log => {
      const matchesDate = (!startDate || log.timestamp >= startDate) &&
                         (!endDate || log.timestamp <= endDate);
      const matchesAction = !action || log.action === action;
      return matchesDate && matchesAction;
    });
  }, [auditLogs]);

  return (
    <AdminContext.Provider
      value={{
        users,
        addUser,
        updateUser,
        deleteUser,
        getUserById,
        roles,
        addRole,
        updateRole,
        deleteRole,
        getRoleByName,
        permissions,
        addPermission,
        updatePermission,
        deletePermission,
        settings,
        updateSetting,
        getSettingByKey,
        auditLogs,
        addAuditLog,
        clearAuditLogs,
        getFilteredLogs,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
