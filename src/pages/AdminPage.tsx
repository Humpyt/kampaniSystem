import React, { useState } from 'react';
import { Users, Shield, Settings, FileText, ChevronRight, Plus, Edit2, Trash2, X, Target } from 'lucide-react';
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

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3000/api/auth/users', {
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
      const response = await fetch('http://localhost:3000/api/auth/register', {
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
      const response = await fetch(`http://localhost:3000/api/auth/users/${userId}`, {
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

  const AVAILABLE_PERMISSIONS = [
    // Basic permissions (all staff)
    { id: 'view_customers', name: 'View Customers', description: 'Access customer list and details' },
    { id: 'create_drop', name: 'Create Drop Orders', description: 'Create new drop-off orders' },
    { id: 'create_pickup', name: 'Create Pickups', description: 'Process pickup orders' },
    { id: 'send_messages', name: 'Send Messages', description: 'Send messages to customers' },
    { id: 'view_operations', name: 'View Operations', description: 'View repair operations' },
    { id: 'view_sales', name: 'View Sales', description: 'Access sales records' },
    { id: 'view_marketing', name: 'View Marketing', description: 'Access marketing features' },
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
      'view_operations', 'view_sales', 'view_marketing', 'view_qrcodes',
      'view_business_targets'
    ],
    manager: [
      'view_customers', 'create_drop', 'create_pickup', 'send_messages',
      'view_operations', 'view_sales', 'view_marketing', 'view_qrcodes',
      'view_business_targets', 'view_all_targets', 'manage_staff', 'view_reports'
    ],
    admin: [
      'view_customers', 'create_drop', 'create_pickup', 'send_messages',
      'view_operations', 'view_sales', 'view_marketing', 'view_qrcodes',
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
                    onClick={() => handleDeleteUser(user.id)}
                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
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
      const response = await fetch('http://localhost:3000/api/business/targets/staff/all', {
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
      const response = await fetch(`http://localhost:3000/api/business/targets/staff/${userId}/targets`, {
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

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-6">Staff Targets Management</h2>
      <div className="grid gap-4">
        {staffTargets.map(staff => (
          <div key={staff.id} className="bg-gray-750 rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-white">{staff.name}</h3>
                <p className="text-sm text-gray-400">{staff.email}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">
                  Today: {staff.today_sales?.toLocaleString() || 0} / {staff.daily_target?.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">
                  Month: {staff.monthly_sales?.toLocaleString() || 0} / {staff.monthly_target?.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Daily Target (UGX)
                </label>
                <input
                  type="number"
                  defaultValue={staff.daily_target}
                  onBlur={(e) => updateStaffTarget(staff.id, 'daily', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white
                    focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Monthly Target (UGX)
                </label>
                <input
                  type="number"
                  defaultValue={staff.monthly_target}
                  onBlur={(e) => updateStaffTarget(staff.id, 'monthly', parseFloat(e.target.value))}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white
                    focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Monthly Progress</span>
                <span className={staff.monthly_percentage >= 100 ? 'text-green-400' : 'text-yellow-400'}>
                  {staff.monthly_percentage?.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    staff.monthly_percentage >= 100 ? 'bg-green-500' :
                    staff.monthly_percentage >= 75 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(staff.monthly_percentage || 0, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
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