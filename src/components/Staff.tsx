import React, { useState, useEffect } from 'react';
import { Users, PlusCircle, Briefcase, Mail, Target, TrendingUp, AlertCircle, LayoutGrid, LayoutList, Loader2 } from 'lucide-react';
import type { Staff } from '../types';
import StaffModal from './StaffModal';
import StaffTargetModal from './StaffTargetModal';
import { Pagination } from './Pagination';
import { formatCurrency } from '../utils/formatCurrency';
import { getAuthToken } from '../store/authStore';
import toast from 'react-hot-toast';

const ITEMS_PER_PAGE = 10;
const DAILY_TARGET = 1200000;

// Helper function to transform user data to Staff interface
const transformUserToStaff = (user: any, performance: any): Staff => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  specialization: ['shoe', 'bag'], // Default specialization
  active: user.status === 'active',
  currentWorkload: 0, // Will be fetched from operations if needed
  dailyTarget: performance?.daily_target || DAILY_TARGET,
  currentProgress: performance?.today_sales || 0
});

export function Staff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch staff data on component mount
  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Fetch users and their performance data
        const [usersResponse, performanceResponse] = await Promise.all([
          fetch('http://localhost:3000/api/auth/users', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:3000/api/business/targets/staff/all', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (!usersResponse.ok || !performanceResponse.ok) {
          throw new Error('Failed to fetch staff data');
        }

        const users = await usersResponse.json();
        const performances = await performanceResponse.json();

        // Create a map of user_id to performance data
        const performanceMap = new Map(
          performances.map((p: any) => [p.user_id, p])
        );

        // Transform users to Staff format
        const transformedStaff = users
          .filter((user: any) => user.status === 'active') // Only show active staff
          .map((user: any) => transformUserToStaff(user, performanceMap.get(user.id)));

        setStaff(transformedStaff);
      } catch (error) {
        console.error('Error fetching staff data:', error);
        toast.error('Failed to load staff data');
      } finally {
        setLoading(false);
      }
    };

    fetchStaffData();
  }, []);

  const totalPages = Math.ceil(staff.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedStaff = staff.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleAddStaff = async (staffMember: Omit<Staff, 'id'>) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Register new staff member via API
      const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: staffMember.name,
          email: staffMember.email,
          password: 'temp123', // Default password, should be changed on first login
          role: staffMember.role
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create staff member');
      }

      const newUser = await response.json();

      // Add to local state
      const newStaff: Staff = {
        ...staffMember,
        id: newUser.id,
        dailyTarget: DAILY_TARGET,
        currentProgress: 0
      };
      setStaff([...staff, newStaff]);
      toast.success('Staff member added successfully');
    } catch (error) {
      console.error('Error adding staff:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add staff member');
      throw error;
    }
  };

  const handleEditStaff = (staffMember: Staff) => {
    setStaff(staff.map(s => s.id === staffMember.id ? staffMember : s));
    toast.success('Staff member updated successfully');
  };

  const handleUpdateTarget = (staffId: string, newProgress: number) => {
    setStaff(staff.map(s => s.id === staffId ? { ...s, currentProgress: newProgress } : s));
    toast.success('Progress updated successfully');
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {paginatedStaff.map((member) => {
        const progressPercentage = Math.round((member.currentProgress / member.dailyTarget) * 100);
        return (
          <div key={member.id} className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-full bg-indigo-900/50 flex items-center justify-center">
                <Users className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-white">{member.name}</h3>
                <p className="text-sm text-gray-400">{member.role}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-300">
                <Mail className="h-4 w-4 text-gray-500 mr-2" />
                <span>{member.email}</span>
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <Briefcase className="h-4 w-4 text-gray-500 mr-2" />
                <span>Current workload: {member.currentWorkload} orders</span>
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <Target className="h-4 w-4 text-gray-500 mr-2" />
                <span>Daily Progress: {formatCurrency(member.currentProgress)} / {formatCurrency(member.dailyTarget)}</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {member.specialization.map((spec) => (
                  <span
                    key={spec}
                    className="px-2 py-0.5 text-xs rounded bg-gray-700 text-gray-300"
                  >
                    {spec.charAt(0).toUpperCase() + spec.slice(1)}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-300">Daily Target Progress</span>
                <span className={`text-sm font-medium ${
                  progressPercentage >= 100 ? 'text-green-500' :
                  progressPercentage >= 90 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {progressPercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    progressPercentage >= 100 ? 'bg-green-500' :
                    progressPercentage >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between">
              <button
                onClick={() => {
                  setEditingStaff(member);
                  setIsModalOpen(true);
                }}
                className="text-sm text-indigo-400 hover:text-indigo-300"
              >
                Edit Details
              </button>
              <button
                onClick={() => {
                  setSelectedStaff(member);
                  setIsTargetModalOpen(true);
                }}
                className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center"
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Update Progress
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-1">
      {paginatedStaff.map((member) => {
        const progressPercentage = Math.round((member.currentProgress / member.dailyTarget) * 100);
        return (
          <div key={member.id} className="grid grid-cols-5 gap-4 p-4 hover:bg-gray-750 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-900/50 flex items-center justify-center">
                <Users className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <div className="font-medium text-white">{member.name}</div>
                <div className="text-sm text-gray-400">{member.email}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div>
                <div className="text-white capitalize">{member.role}</div>
                <div className="flex gap-2 mt-1">
                  {member.specialization.map((spec) => (
                    <span
                      key={spec}
                      className="px-2 py-0.5 text-xs rounded bg-gray-700 text-gray-300"
                    >
                      {spec.charAt(0).toUpperCase() + spec.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center text-white">
              {member.currentWorkload} orders
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      progressPercentage >= 100 ? 'bg-green-500' :
                      progressPercentage >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-sm whitespace-nowrap">
                <span className={
                  progressPercentage >= 100 ? 'text-green-500' :
                  progressPercentage >= 90 ? 'text-yellow-500' : 'text-red-500'
                }>
                  {progressPercentage}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => {
                  setSelectedStaff(member);
                  setIsTargetModalOpen(true);
                }}
                className="text-indigo-400 hover:text-indigo-300"
              >
                Update Target
              </button>
              <button
                onClick={() => {
                  setEditingStaff(member);
                  setIsModalOpen(true);
                }}
                className="text-indigo-400 hover:text-indigo-300"
              >
                Edit
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Staff Management</h1>
          <p className="text-sm text-gray-400 mt-1">Daily target per staff: {formatCurrency(DAILY_TARGET)}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'text-indigo-400 bg-indigo-900/50' : 'text-gray-400 hover:text-gray-500'}`}
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'text-indigo-400 bg-indigo-900/50' : 'text-gray-400 hover:text-gray-500'}`}
            >
              <LayoutList className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={() => {
              setEditingStaff(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Add Staff Member
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
          <span className="ml-3 text-gray-400">Loading staff data...</span>
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No staff members found. Add your first staff member to get started.</p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? renderGridView() : renderListView()}
        </>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={staff.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

      <StaffModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStaff(null);
        }}
        onSave={editingStaff ? handleEditStaff : handleAddStaff}
        staff={editingStaff}
      />

      <StaffTargetModal
        isOpen={isTargetModalOpen}
        onClose={() => {
          setIsTargetModalOpen(false);
          setSelectedStaff(null);
        }}
        onSave={handleUpdateTarget}
        staff={selectedStaff}
        dailyTarget={DAILY_TARGET}
      />
    </div>
  );
}

export default Staff;