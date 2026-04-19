import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { format, startOfMonth } from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNavigate } from 'react-router-dom';
import { getAuthToken, useAuthStore } from '../store/authStore';
import {
  faTicket,
  faSearch,
  faBoxesStacked,
  faWarehouse,
  faHandshake,
  faTruckFast,
  faMoneyBillTransfer,
  faCheckCircle,
  faTriangleExclamation,
  faCoins,
  faChartLine,
  faPercent,
  faUserPlus,
  faTrophy,
  faStar,
  faCreditCard,
  faMoneyBillWave,
} from '@fortawesome/free-solid-svg-icons';

const ADMIN_MONTHLY = { red: 30000000, orange: 80000000, green: 104000000 };
const ADMIN_DAILY = { red: 1500000, orange: 2500000, green: 4000000 };
const STAFF_MONTHLY = { red: 8000000, orange: 18000000, green: 26000000 };

export default function StorePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    monthlyCollected: 0,
    dailyCollected: 0,
    jobsMonthly: 0,
    jobsToday: 0,
    jobsDoneMonthly: 0,
    jobsPending: 0,
    jobsCollectedMonth: 0,
  });

  const canSeeAllData = user?.role === 'admin' || user?.role === 'manager';
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const monthlyThresholds = isAdmin ? ADMIN_MONTHLY : STAFF_MONTHLY;
  const dailyThresholds = ADMIN_DAILY;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);

        const today = format(new Date(), 'yyyy-MM-dd');
        const now = new Date();
        const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
        const startOfTodayIso = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const monthStartIso = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const nowIso = now.toISOString();
        const token = getAuthToken();
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        const operationsUrl = API_ENDPOINTS.operations;

        const salesUrl = `${API_ENDPOINTS.sales}?startDate=${encodeURIComponent(monthStartIso)}&endDate=${encodeURIComponent(nowIso)}`;

        const [opsResult, salesResult] = await Promise.allSettled([
          fetch(operationsUrl, { headers }),
          canSeeAllData ? fetch(salesUrl, { headers }) : Promise.resolve(null),
        ]);

        const operations =
          opsResult.status === 'fulfilled' && opsResult.value.ok
            ? (() => {
                const payloadPromise = opsResult.value.json();
                return payloadPromise;
              })()
            : Promise.resolve([]);

        const sales =
          salesResult.status === 'fulfilled' && salesResult.value && salesResult.value.ok
            ? (() => {
                const payloadPromise = salesResult.value.json();
                return payloadPromise;
              })()
            : Promise.resolve([]);

        const [operationsPayload, salesPayload] = await Promise.all([operations, sales]);
        const normalizedOperations = Array.isArray(operationsPayload)
          ? operationsPayload
          : Array.isArray((operationsPayload as any)?.data)
            ? (operationsPayload as any).data
            : [];
        const normalizedSales = Array.isArray(salesPayload) ? salesPayload : [];

        const jobsThisMonth = normalizedOperations.filter(
          (op: any) =>
            typeof (op.createdAt || op.created_at) === 'string' &&
            (op.createdAt || op.created_at).startsWith(monthStart.slice(0, 7))
        );
        const jobsToday = normalizedOperations.filter(
          (op: any) =>
            typeof (op.createdAt || op.created_at) === 'string' &&
            (op.createdAt || op.created_at).startsWith(today)
        );
        const salesToday = normalizedSales.filter((sale: any) =>
          typeof sale.created_at === 'string' && sale.created_at.startsWith(today)
        );
        const monthlySalesTotal = normalizedSales.reduce(
          (sum: number, sale: any) => sum + (Number(sale.total_amount) || 0),
          0
        );
        const dailySalesTotal = salesToday.reduce(
          (sum: number, sale: any) => sum + (Number(sale.total_amount) || 0),
          0
        );
        const monthlyOperationsTotal = jobsThisMonth.reduce(
          (sum: number, op: any) => sum + (Number(op.totalAmount || op.total_amount) || 0),
          0
        );
        const dailyOperationsTotal = jobsToday.reduce(
          (sum: number, op: any) => sum + (Number(op.totalAmount || op.total_amount) || 0),
          0
        );
        const jobsDoneMonthly = jobsThisMonth.reduce((sum: number, op: any) => {
          const workflowStatus = op.workflowStatus || op.workflow_status;
          const isDone =
            workflowStatus === 'ready' ||
            workflowStatus === 'delivered' ||
            op.status === 'completed';
          return isDone ? sum + (Array.isArray(op.shoes) ? op.shoes.length : 0) : sum;
        }, 0);
        const monthlyCollected = canSeeAllData
          ? (normalizedSales.length > 0 ? monthlySalesTotal : monthlyOperationsTotal)
          : monthlyOperationsTotal;
        const dailyCollected = canSeeAllData
          ? (salesToday.length > 0 ? dailySalesTotal : dailyOperationsTotal)
          : dailyOperationsTotal;

        setDashboardStats({
          monthlyCollected,
          dailyCollected,
          jobsMonthly: jobsThisMonth.length,
          jobsToday: jobsToday.length,
          jobsDoneMonthly,
          jobsPending: jobsThisMonth.filter(
            (op: any) =>
              op.workflowStatus === 'pending' ||
              op.workflow_status === 'pending' ||
              op.status === 'pending'
          ).length,
          jobsCollectedMonth: jobsThisMonth.filter(
            (op: any) =>
              op.workflowStatus === 'delivered' ||
              op.workflow_status === 'delivered' ||
              op.status === 'completed'
          ).length,
        });
      } catch (error) {
        console.error('Error fetching store data:', error);
        setDashboardStats({
          monthlyCollected: 0,
          dailyCollected: 0,
          jobsMonthly: 0,
          jobsToday: 0,
          jobsDoneMonthly: 0,
          jobsPending: 0,
          jobsCollectedMonth: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, [user?.id, canSeeAllData]);

  const handleQuickAction = (path: string) => navigate(path);

  const SegmentedProgressBar = ({
    value,
    thresholds,
  }: {
    value: number;
    thresholds: { red: number; orange: number; green: number };
  }) => {
    const max = thresholds.green;
    const redWidth = (thresholds.red / max) * 100;
    const orangeWidth = ((thresholds.orange - thresholds.red) / max) * 100;
    const greenWidth = ((thresholds.green - thresholds.orange) / max) * 100;

    const redFill = Math.min(100, (value / thresholds.red) * 100);
    const orangeFill =
      Math.min(
        100,
        Math.max(0, (value - thresholds.red) / (thresholds.orange - thresholds.red))
      ) * 100;
    const greenFill =
      Math.min(
        100,
        Math.max(0, (value - thresholds.orange) / (thresholds.green - thresholds.orange))
      ) * 100;

    const isOverRed = value > thresholds.red;
    const isOverOrange = value > thresholds.orange;
    const isOverGreen = value > thresholds.green;

    return (
      <div className="flex h-4 w-full gap-x-0.5 overflow-hidden rounded-full shadow-inner">
        <div className="relative h-full bg-gray-800" style={{ width: `${redWidth}%` }}>
          <div
            className="absolute left-0 top-0 h-full rounded-l-full bg-gradient-to-r from-red-600 to-red-500 transition-all duration-700 ease-out"
            style={{ width: `${isOverRed ? 100 : redFill}%` }}
          />
        </div>
        <div className="relative h-full bg-gray-800" style={{ width: `${orangeWidth}%` }}>
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-600 to-amber-500 transition-all duration-700 ease-out"
            style={{ width: `${isOverOrange ? 100 : orangeFill}%` }}
          />
        </div>
        <div className="relative h-full bg-gray-800" style={{ width: `${greenWidth}%` }}>
          <div
            className="absolute left-0 top-0 h-full rounded-r-full bg-gradient-to-r from-green-600 to-emerald-400 transition-all duration-700 ease-out"
            style={{ width: `${isOverGreen ? 100 : greenFill}%` }}
          />
        </div>
      </div>
    );
  };

  const RevenueCard = ({
    title,
    value,
    thresholds,
  }: {
    title: string;
    value: number;
    thresholds: { red: number; orange: number; green: number };
  }) => {
    const max = thresholds.green;
    const percent = Math.min(100, (value / max) * 100);
    const balance = Math.max(0, max - value);

    let zoneColor = 'text-red-400';
    if (value >= thresholds.orange) zoneColor = 'text-orange-400';
    if (value >= thresholds.green) zoneColor = 'text-emerald-400';

    return (
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-gray-900/40 p-6 shadow-xl transition-all duration-500 hover:bg-gray-800/50">
        <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl transition-all duration-500 group-hover:bg-indigo-500/20"></div>
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-purple-500/5 blur-2xl"></div>

        <div className="relative z-10">
          <div className="mb-4 flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <span
                className={`h-2 w-2 rounded-full ${
                  value >= thresholds.green
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                    : value >= thresholds.orange
                      ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]'
                      : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                }`}
              ></span>
              {title}
            </p>
            <span className={`text-sm font-bold ${zoneColor}`}>{percent.toFixed(1)}%</span>
          </div>

          <SegmentedProgressBar value={value} thresholds={thresholds} />

          <div className="mt-1 flex justify-between font-mono text-[9px] text-gray-500">
            <span>0-{thresholds.red.toLocaleString()}</span>
            <span>{thresholds.red.toLocaleString()}-{thresholds.orange.toLocaleString()}</span>
            <span>{thresholds.orange.toLocaleString()}-{thresholds.green.toLocaleString()}</span>
          </div>
        </div>

        <div className="relative z-10 mt-4 border-t border-white/5 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Collected</span>
            <span className="text-sm font-bold text-emerald-400">{value.toLocaleString()}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-gray-400">Target</span>
            <span className="text-sm text-gray-300">{max.toLocaleString()}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-gray-400">Balance</span>
            <span className="text-sm font-medium text-amber-400">{balance.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

  const operations = [
    {
      label: 'Total Discounts',
      icon: faPercent,
      path: '/discounts',
      color:
        'border-purple-500/20 bg-purple-500/10 text-purple-400 hover:border-purple-500 hover:bg-purple-500/20',
    },
    {
      label: 'New Customers',
      icon: faUserPlus,
      path: '/new-customers',
      color:
        'border-indigo-500/20 bg-indigo-500/10 text-indigo-400 hover:border-indigo-500 hover:bg-indigo-500/20',
    },
    {
      label: 'Customer Rankings',
      icon: faTrophy,
      path: '/customer-rankings',
      color:
        'border-amber-500/20 bg-amber-500/10 text-amber-400 hover:border-amber-500 hover:bg-amber-500/20',
    },
    {
      label: 'Most Performing Service',
      icon: faStar,
      path: '/most-performing',
      color:
        'border-rose-500/20 bg-rose-500/10 text-rose-400 hover:border-rose-500 hover:bg-rose-500/20',
    },
    {
      label: 'Unpaid Balances',
      icon: faMoneyBillWave,
      path: '/balances',
      color:
        'border-orange-500/20 bg-orange-500/10 text-orange-400 hover:border-orange-500 hover:bg-orange-500/20',
    },
  ];

  const actionNeeded = [
    {
      label: 'Overdue',
      icon: faTriangleExclamation,
      path: '/balances',
      count: 12,
      color: 'from-red-500 to-rose-600',
    },
    {
      label: 'Ready pick today',
      icon: faCheckCircle,
      path: '/ready-to-pick',
      count: 8,
      color: 'from-emerald-500 to-green-600',
    },
    {
      label: 'Low stock',
      icon: faBoxesStacked,
      path: '/supplies',
      count: 5,
      color: 'from-orange-500 to-amber-600',
    },
    {
      label: 'Expenses',
      icon: faMoneyBillTransfer,
      path: '/expenses',
      count: 3,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      label: 'Staff performance',
      icon: faChartLine,
      path: '/business-targets',
      count: 4,
      color: 'from-purple-500 to-fuchsia-600',
    },
    {
      label: 'Commissions',
      icon: faCoins,
      path: '/business-targets',
      count: 2,
      color: 'from-yellow-500 to-orange-600',
    },
  ];

  return (
    <div className="h-full overflow-y-auto bg-gray-900 p-8">
      <div className="relative mb-8 rounded-3xl border border-white/10 bg-gray-800/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="pointer-events-none absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl"></div>
        <div className="pointer-events-none absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-purple-600/20 blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h1 className="mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-4xl font-extrabold text-transparent">
              {user?.name ? `${user.name}'s Dashboard` : 'Store Dashboard'}
            </h1>
            <p className="text-sm text-gray-400 md:text-base">
              {user?.name ? `Welcome back, ${user.name}!` : 'Good to see you!'} Here's today's
              overview at a glance.
            </p>
          </div>

          <div className="flex flex-col items-end rounded-xl border border-white/5 bg-black/30 px-6 py-4 shadow-inner backdrop-blur-md">
            <span className="font-mono text-3xl font-light tracking-wider text-indigo-300 md:text-4xl">
              {format(currentTime, 'hh:mm:ss a')}
            </span>
            <span className="mt-1 text-xs font-medium uppercase tracking-widest text-gray-500 md:text-sm">
              {format(currentTime, 'MMMM dd, yyyy')}
            </span>
          </div>
        </div>

        <div className="relative z-10 mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <RevenueCard
            title={`${isStaff ? 'My Monthly Revenue' : 'Monthly Revenue'} - ${format(currentTime, 'MMM yyyy')}`}
            value={dashboardStats.monthlyCollected}
            thresholds={monthlyThresholds}
          />

          <RevenueCard
            title={`${isStaff ? 'My Daily Revenue' : 'Daily Revenue'} - ${format(currentTime, 'MMM dd')}`}
            value={dashboardStats.dailyCollected}
            thresholds={dailyThresholds}
          />

          <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-gray-900/40 p-6 shadow-xl transition-all duration-500 hover:bg-gray-800/50">
            <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl transition-all duration-500 group-hover:bg-indigo-500/20"></div>
            <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-purple-500/5 blur-2xl"></div>

            <div className="relative z-10 flex flex-col gap-3">
              <p className="flex items-center border-b border-white/5 pb-3 text-sm font-medium text-gray-300">
                <span className="mr-2 h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
                {isStaff ? 'My Monthly Jobs Done' : 'Total Monthly Jobs Recieved'} - {format(currentTime, 'MMM')} -
                <span className="ml-1 font-bold text-white">
                  {(isStaff ? dashboardStats.jobsDoneMonthly : dashboardStats.jobsMonthly).toLocaleString()}
                </span>
              </p>

              <p className="text-sm font-semibold text-gray-200">
                {isStaff ? 'My Jobs Received Today:' : 'Total Jobs Recieved today:'}
                <span className="ml-1 font-mono text-emerald-400">{dashboardStats.jobsToday}</span>
              </p>

              <p className="text-sm text-gray-300">
                {isStaff ? 'Items completed this month:' : 'Total jobs collected by customer today:'}
                <span className="ml-1 text-gray-500">
                  {isStaff ? dashboardStats.jobsDoneMonthly.toLocaleString() : '---'}
                </span>
              </p>
            </div>

            <div className="relative z-10 mt-4 flex items-end justify-between border-t border-white/5 pt-4 text-xs text-gray-400">
              <span className="font-semibold italic text-gray-300">
                Total jobs pending: {dashboardStats.jobsPending}
              </span>
              <span>
                monthly jobs collected by customer:{' '}
                {dashboardStats.jobsCollectedMonth.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-5 rounded-3xl border border-white/5 bg-gray-800/40 p-6 shadow-xl backdrop-blur-xl lg:col-span-7 md:p-8">
          <div className="px-1 xl:mb-2 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-wide text-white">Daily Operations</h2>
            <div className="ml-6 h-px flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {operations.map((op, i) => (
              <button
                key={i}
                onClick={() => handleQuickAction(op.path)}
                className={`group flex flex-col items-center justify-center rounded-2xl border p-5 text-center shadow-sm transition-all duration-300 hover:shadow-lg ${op.color}`}
              >
                <div className="mb-3 transform transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110">
                  <FontAwesomeIcon icon={op.icon} className="text-3xl" />
                </div>
                <span className="text-sm font-semibold tracking-wide">{op.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5 rounded-3xl border border-white/5 bg-gray-800/40 p-6 shadow-xl backdrop-blur-xl lg:col-span-5 md:p-8">
          <div className="px-1 xl:mb-2 flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-wide text-white">Action Needed</h2>
            <div className="ml-6 h-px flex-1 bg-gradient-to-r from-red-500/40 to-transparent"></div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {actionNeeded.map((action, i) => (
              <button
                key={i}
                onClick={() => handleQuickAction(action.path)}
                className="group relative flex items-center justify-between overflow-hidden rounded-xl border border-white/5 bg-gray-900/50 p-4 transition-all duration-300 hover:border-white/20 hover:bg-gray-800"
              >
                <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${action.color}`}></div>
                <div className="z-10 ml-2 flex items-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${action.color} shadow-md transition-transform duration-300 group-hover:scale-110`}
                  >
                    <FontAwesomeIcon icon={action.icon} className="text-sm text-white md:text-base" />
                  </div>
                  <span className="ml-3 text-sm font-semibold text-gray-300 transition-colors group-hover:text-white">
                    {action.label}
                  </span>
                </div>
                {action.count > 0 && (
                  <div className="z-10 flex h-[28px] min-w-[28px] items-center justify-center rounded-full border border-white/10 bg-gray-900 text-xs font-bold text-white shadow-inner">
                    {action.count}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
