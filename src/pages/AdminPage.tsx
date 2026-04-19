import React, { useState } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { Users, Shield, Settings, FileText, ChevronRight, Plus, Edit2, Trash2, X, Target, TrendingUp, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type AdminSection = 'users' | 'staff-targets' | 'settings' | 'audit';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  status: string;
  total_operations: number;
  total_sales: number;
  created_at: string;
  daily_target?: number;
  monthly_target?: number;
}

interface Permission {
  id: string;
  name: string;
  description: string;
}

const AdminPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AdminSection>('users');

  const sections = [
    { id: 'users' as AdminSection, name: 'Staff Management', icon: Users },
    { id: 'staff-targets' as AdminSection, name: 'Staff Targets', icon: Target },
    { id: 'settings' as AdminSection, name: 'System Settings', icon: Settings },
    { id: 'audit' as AdminSection, name: 'Audit Logs', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'users':
        return <UserManagement />;
      case 'staff-targets':
        return <StaffTargetsManagement />;
      case 'settings':
        return <SystemSettings />;
      case 'audit':
        return <AuditLogs />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-indigo-400">Admin Dashboard</h1>
        <p className="text-gray-400">Manage staff accounts and system settings</p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Sidebar Navigation */}
        <div className="col-span-1">
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                  ${activeSection === section.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                  }`}
              >
                <section.icon className="h-5 w-5" />
                <span>{section.name}</span>
                {activeSection === section.id && (
                  <ChevronRight className="h-4 w-4 ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-4 bg-gray-800 rounded-lg p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// User Management Section
const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState<{
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'manager' | 'staff';
    permissions: string[];
  }>({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    permissions: []
  });
  const [editForm, setEditForm] = useState<{
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'manager' | 'staff';
    status: 'active' | 'inactive';
  }>({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    status: 'active'
  });

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(API_ENDPOINTS['auth/users'], {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Load users on component mount
  React.useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(API_ENDPOINTS['auth/register'], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
          permissions: newUser.permissions.length > 0 ? newUser.permissions : undefined
        })
      });

      if (response.ok) {
        await fetchUsers(); // Refresh user list
        setNewUser({ name: '', email: '', password: '', role: 'staff', permissions: [] });
        setShowAddModal(false);
        alert('Staff account created successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to create staff account: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create staff account');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this staff account?')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_ENDPOINTS['auth/users']}/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchUsers(); // Refresh user list
        alert('Staff account deleted successfully!');
      } else {
        alert('Failed to delete staff account');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete staff account');
    }
  };

  const handleOpenEditModal = (user: StaffUser) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status as 'active' | 'inactive'
    });
    setShowEditModal(true);
  };

  const handleEditUser = async () => {
    if (!editingUser || !editForm.name || !editForm.email) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_ENDPOINTS['auth/users']}/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          role: editForm.role,
          status: editForm.status,
          ...(editForm.password ? { password: editForm.password } : {})
        })
      });

      if (response.ok) {
        await fetchUsers();
        setShowEditModal(false);
        setEditingUser(null);
        setEditForm({ name: '', email: '', password: '', role: 'staff', status: 'active' });
        alert('Staff account updated successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to update staff account: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update staff account');
    } finally {
      setLoading(false);
    }
  };

  const AVAILABLE_PERMISSIONS = [
    // Basic permissions (all staff)
    { id: 'view_customers', name: 'View Customers', description: 'Access customer list and details' },
    { id: 'create_drop', name: 'Create Drop Orders', description: 'Create new drop-off orders' },
    { id: 'create_pickup', name: 'Create Pickups', description: 'Process pickup orders' },
    { id: 'send_messages', name: 'Send Messages', description: 'Send messages to customers' },
    { id: 'view_operations', name: 'View Operations', description: 'View repair operations' },
    { id: 'view_sales', name: 'View Sales', description: 'Access sales records' },
    { id: 'view_qrcodes', name: 'View QR Codes', description: 'Generate and view QR codes' },
    { id: 'view_business_targets', name: 'View Business Targets', description: 'View own performance targets' },
    // Manager permissions
    { id: 'view_all_targets', name: 'View All Staff Targets', description: 'View all staff performance' },
    { id: 'manage_staff', name: 'Manage Staff', description: 'Manage staff accounts' },
    { id: 'view_reports', name: 'View Reports', description: 'Access business reports' },
    // Admin permissions
    { id: 'manage_users', name: 'Manage Users', description: 'Create and manage user accounts' },
    { id: 'manage_settings', name: 'Manage Settings', description: 'Access system settings' },
    { id: 'manage_inventory', name: 'Manage Inventory', description: 'Manage product inventory' },
    { id: 'manage_supplies', name: 'Manage Supplies', description: 'Manage supplies and stock' }
  ];

  const PERMISSION_GROUPS = {
    staff: [
      'view_customers', 'create_drop', 'create_pickup', 'send_messages',
      'view_operations', 'view_sales', 'view_qrcodes',
      'view_business_targets'
    ],
    manager: [
      'view_customers', 'create_drop', 'create_pickup', 'send_messages',
      'view_operations', 'view_sales', 'view_qrcodes',
      'view_business_targets', 'view_all_targets', 'manage_staff', 'view_reports'
    ],
    admin: [
      'view_customers', 'create_drop', 'create_pickup', 'send_messages',
      'view_operations', 'view_sales', 'view_qrcodes',
      'view_business_targets', 'view_all_targets', 'manage_staff', 'view_reports',
      'manage_users', 'manage_settings', 'manage_inventory', 'manage_supplies'
    ]
  };

  const UserModal: React.FC = () => {
    const [localPermissions, setLocalPermissions] = useState<string[]>(newUser.permissions);

    const handleRoleChange = (role: 'admin' | 'manager' | 'staff') => {
      setNewUser(prev => ({ ...prev, role, permissions: PERMISSION_GROUPS[role] }));
      setLocalPermissions(PERMISSION_GROUPS[role]);
    };

    const togglePermission = (permissionId: string) => {
      const newPermissions = localPermissions.includes(permissionId)
        ? localPermissions.filter(p => p !== permissionId)
        : [...localPermissions, permissionId];

      setLocalPermissions(newPermissions);
      setNewUser(prev => ({ ...prev, permissions: newPermissions }));
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl my-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-white">Create Staff Account</h3>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white
                    focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white
                    focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="user@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password *</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white
                  focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Enter a secure password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Role *</label>
              <select
                value={newUser.role}
                onChange={(e) => handleRoleChange(e.target.value as any)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white
                  focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Permissions ({localPermissions.length} selected)
              </label>
              <div className="bg-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto grid grid-cols-2 gap-2">
                {AVAILABLE_PERMISSIONS.map(permission => (
                  <label key={permission.id} className="flex items-start gap-2 p-2 hover:bg-gray-600 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localPermissions.includes(permission.id)}
                      onChange={() => togglePermission(permission.id)}
                      className="mt-1 rounded border-gray-500 text-indigo-600 focus:ring-indigo-500 bg-gray-600"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-white font-medium">{permission.name}</div>
                      <div className="text-xs text-gray-400">{permission.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Edit User Modal
  const EditUserModal: React.FC = () => {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md my-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-white">Edit Staff Account</h3>
            <button
              onClick={() => setShowEditModal(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Full Name *</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white
                  focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email Address *</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white
                  focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                New Password <span className="text-gray-500 text-xs">(leave blank to keep current)</span>
              </label>
              <input
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white
                  focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="Enter new password to reset"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Role *</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white
                    focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Status *</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white
                    focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditUser}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-6">Staff Management</h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex-1 mr-4">
            <input
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400
                focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Create Staff Account
          </button>
        </div>

        <div className="bg-gray-750 rounded-lg overflow-hidden">
          <div className="grid grid-cols-6 gap-4 p-4 border-b border-gray-700 text-gray-400 font-medium">
            <div>STAFF</div>
            <div>EMAIL</div>
            <div>ROLE</div>
            <div>STATUS</div>
            <div>STATS</div>
            <div>ACTIONS</div>
          </div>
          <div className="divide-y divide-gray-700">
            {filteredUsers.map(user => (
              <div key={user.id} className="grid grid-cols-6 gap-4 p-4 items-center">
                <div className="text-white font-medium">{user.name}</div>
                <div className="text-gray-300 text-sm">{user.email}</div>
                <div>
                  <span className={`px-2 py-1 text-xs rounded-full uppercase ${
                    user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' :
                    user.role === 'manager' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.status === 'active'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {user.status}
                  </span>
                </div>
                <div className="text-sm text-gray-400">
                  {user.total_operations} ops / {user.total_sales} sales
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(user)}
                    className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors"
                    title="Edit staff account"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    title="Delete staff account"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {showAddModal && <UserModal />}
      {showEditModal && <EditUserModal />}
    </div>
  );
};

// Staff Targets Management Section
const StaffTargetsManagement: React.FC = () => {
  const [staffTargets, setStaffTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStaffTargets = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(API_ENDPOINTS['business/targets/staff/all'], {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStaffTargets(data);
      }
    } catch (error) {
      console.error('Error fetching staff targets:', error);
    }
  };

  React.useEffect(() => {
    fetchStaffTargets();
  }, []);

  const updateStaffTarget = async (userId: string, targetType: 'daily' | 'monthly', value: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_ENDPOINTS['business/targets/staff']}/${userId}/targets`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          [`${targetType}_target`]: value
        })
      });

      if (response.ok) {
        await fetchStaffTargets();
        alert('Target updated successfully!');
      } else {
        alert('Failed to update target');
      }
    } catch (error) {
      console.error('Error updating target:', error);
      alert('Failed to update target');
    }
  };

  // Calculate aggregate stats
  const totalMonthlyTarget = staffTargets.reduce((sum, s) => sum + (s.monthly_target || 0), 0);
  const totalMonthlySales = staffTargets.reduce((sum, s) => sum + (s.monthly_sales || 0), 0);
  const overallProgress = totalMonthlyTarget > 0 ? (totalMonthlySales / totalMonthlyTarget) * 100 : 0;
  const activeStaff = staffTargets.filter(s => s.today_sales > 0).length;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Staff Targets</h2>
          <p className="text-gray-400 text-sm">Performance and quota management</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-medium border border-emerald-500/20">
            {activeStaff} active today
          </span>
        </div>
      </div>

      {/* Summary Cards - Matching Operation Page Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Overall Monthly */}
        <div className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/30 rounded-xl p-4 border border-indigo-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-indigo-300 text-xs font-medium flex items-center gap-1 uppercase tracking-wide">
              <TrendingUp size={12} />
              Overall Monthly
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
              overallProgress >= 100 ? 'bg-emerald-500/20 text-emerald-400' :
              overallProgress >= 75 ? 'bg-amber-500/20 text-amber-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {overallProgress.toFixed(0)}%
            </span>
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {formatCurrency(totalMonthlySales)}
          </p>
          <p className="text-indigo-300/60 text-xs">
            of {formatCurrency(totalMonthlyTarget)} target
          </p>
          <div className="mt-3 h-1.5 bg-indigo-950/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-500"
              style={{ width: `${Math.min(overallProgress, 100)}%` }}
            />
          </div>
        </div>

        {/* Daily Average */}
        <div className="bg-gradient-to-br from-violet-900/50 to-violet-800/30 rounded-xl p-4 border border-violet-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-violet-300 text-xs font-medium flex items-center gap-1 uppercase tracking-wide">
              <Target size={12} />
              Daily Average
            </span>
            <TrendingUp size={16} className="text-violet-400" />
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {formatCurrency(staffTargets.length > 0 ? totalMonthlySales / 30 : 0)}
          </p>
          <p className="text-violet-300/60 text-xs">
            across {staffTargets.length} staff members
          </p>
        </div>

        {/* On Track */}
        <div className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/30 rounded-xl p-4 border border-emerald-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-emerald-300 text-xs font-medium flex items-center gap-1 uppercase tracking-wide">
              <CheckCircle size={12} />
              On Track
            </span>
            <span className="text-emerald-400 text-xs">
              75%+ target
            </span>
          </div>
          <p className="text-2xl font-bold text-white mb-1">
            {staffTargets.filter(s => (s.monthly_percentage || 0) >= 75).length}
          </p>
          <p className="text-emerald-300/60 text-xs">
            of {staffTargets.length} meeting goal
          </p>
        </div>
      </div>

      {/* Targets Table - Matching Operation Page Style */}
      <div className="card-bevel overflow-hidden">
        <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          <table className="w-full">
            <thead className="bg-gray-800/80 backdrop-blur-sm sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Staff Member</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Daily Target</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Today</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Daily %</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Monthly Target</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Month Total</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Monthly %</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {staffTargets.map((staff, index) => {
                const dailyProgress = staff.daily_target > 0 ? (staff.today_sales / staff.daily_target) * 100 : 0;
                const monthlyProgress = staff.monthly_percentage || 0;

                return (
                  <tr
                    key={staff.id}
                    className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'} hover:bg-gray-700 transition-colors`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{staff.name}</p>
                          <p className="text-xs text-gray-500">{staff.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        defaultValue={staff.daily_target}
                        onBlur={(e) => updateStaffTarget(staff.id, 'daily', parseFloat(e.target.value))}
                        className="w-28 px-2 py-1.5 bg-gray-900 border border-gray-600 rounded text-white text-sm text-center
                          focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium text-white">
                        {formatCurrency(staff.today_sales || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        dailyProgress >= 100 ? 'bg-emerald-100 text-emerald-800' :
                        dailyProgress >= 75 ? 'bg-amber-100 text-amber-800' :
                        dailyProgress >= 50 ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {dailyProgress.toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        defaultValue={staff.monthly_target}
                        onBlur={(e) => updateStaffTarget(staff.id, 'monthly', parseFloat(e.target.value))}
                        className="w-28 px-2 py-1.5 bg-gray-900 border border-gray-600 rounded text-white text-sm text-center
                          focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-medium text-white">
                        {formatCurrency(staff.monthly_sales || 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              monthlyProgress >= 100 ? 'bg-emerald-500' :
                              monthlyProgress >= 75 ? 'bg-amber-500' :
                              monthlyProgress >= 50 ? 'bg-blue-500' :
                              'bg-gray-500'
                            }`}
                            style={{ width: `${Math.min(monthlyProgress, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${
                          monthlyProgress >= 100 ? 'text-emerald-400' :
                          monthlyProgress >= 75 ? 'text-amber-400' :
                          'text-gray-400'
                        }`}>
                          {monthlyProgress.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        monthlyProgress >= 100 ? 'bg-emerald-500/10 text-emerald-400' :
                        monthlyProgress >= 75 ? 'bg-amber-500/10 text-amber-400' :
                        'bg-gray-500/10 text-gray-400'
                      }`}>
                        {monthlyProgress >= 100 ? 'Achieved' :
                         monthlyProgress >= 75 ? 'On Track' :
                         monthlyProgress >= 50 ? 'Behind' : 'Far Behind'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// System Settings Section
const SystemSettings: React.FC = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-6">System Settings</h2>
      <div className="bg-gray-750 rounded-lg p-6">
        <p className="text-gray-400">System settings management coming soon...</p>
      </div>
    </div>
  );
};

// Audit Logs Section
const AuditLogs: React.FC = () => {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-6">Audit Logs</h2>
      <div className="bg-gray-750 rounded-lg p-6">
        <p className="text-gray-400">Audit logs coming soon...</p>
      </div>
    </div>
  );
};

export default AdminPage;