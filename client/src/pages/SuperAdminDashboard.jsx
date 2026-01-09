import { useState, useEffect } from 'react';
import { superAdminAPI, securityAPI } from '../services/api';
import useAuthStore from '../context/authStore';
import CompanyDetailsModal from '../components/modals/CompanyDetailsModal';
import UserDetailsModal from '../components/modals/UserDetailsModal';

const SuperAdminDashboard = () => {
  const { user, isSuperAdmin } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Overview data
  const [systemHealth, setSystemHealth] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState(null);
  
  // Security data
  const [securityData, setSecurityData] = useState({
    failedLogins: null,
    suspiciousActivity: null,
    securityReport: null,
    userSessions: null
  });
  
  // Pagination states
  const [companiesPagination, setCompaniesPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [usersPagination, setUsersPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  
  // Search states
  const [companySearch, setCompanySearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  
  // Modal states
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  // Check if user is super admin
  if (!isSuperAdmin()) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-gray-300">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchSystemHealth();
    } else if (activeTab === 'companies') {
      fetchCompanies(1, companySearch);
    } else if (activeTab === 'users') {
      fetchUsers(1, userSearch, userRoleFilter);
    }
  }, [activeTab]);

  // Search handlers
  const handleCompanySearch = (searchTerm) => {
    setCompanySearch(searchTerm);
    fetchCompanies(1, searchTerm);
  };

  const handleUserSearch = (searchTerm) => {
    setUserSearch(searchTerm);
    fetchUsers(1, searchTerm, userRoleFilter);
  };

  const handleUserRoleFilter = (role) => {
    setUserRoleFilter(role);
    fetchUsers(1, userSearch, role);
  };

  // Pagination handlers
  const handleCompanyPageChange = (page) => {
    fetchCompanies(page, companySearch);
  };

  const handleUserPageChange = (page) => {
    fetchUsers(page, userSearch, userRoleFilter);
  };

  const fetchSystemHealth = async () => {
    try {
      setLoading(true);
      const response = await superAdminAPI.getSystemHealth({ days: 30 });
      setSystemHealth(response.data.data);
    } catch (err) {
      setError('Failed to fetch system health data');
      console.error('System health error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await superAdminAPI.getAllCompanies({ 
        page, 
        limit: 20, 
        search: search || undefined 
      });
      setCompanies(response.data.data.companies);
      setCompaniesPagination(response.data.data.pagination);
    } catch (err) {
      setError('Failed to fetch companies data');
      console.error('Companies error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (page = 1, search = '', role = '') => {
    try {
      setLoading(true);
      const response = await superAdminAPI.searchUsersGlobally({ 
        page, 
        limit: 20, 
        search: search || undefined,
        role: role || undefined
      });
      setUsers(response.data.data.users);
      setUsersPagination(response.data.data.pagination);
    } catch (err) {
      setError('Failed to fetch users data');
      console.error('Users error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Company management handlers
  const handleManageCompany = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setSelectedCompany(company);
      setShowCompanyModal(true);
    }
  };

  const handleDeleteCompany = async (companyId) => {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;

    const confirmMessage = `Are you sure you want to delete the company "${company.name}"?\n\nThis will permanently delete:\n- ${company.userCount} users\n- ${company.taskCount} tasks\n- All projects, comments, and related data\n\nThis action cannot be undone.`;

    if (!confirm(confirmMessage)) return;

    try {
      setLoading(true);
      await superAdminAPI.deleteCompany(companyId);
      setMessage(`Company "${company.name}" deleted successfully`);
      // Refresh the companies list
      fetchCompanies(1, companySearch);
    } catch (err) {
      setError('Failed to delete company');
      console.error('Delete company error:', err);
    } finally {
      setLoading(false);
    }
  };

  // User management handlers
  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Enter new password for user:');
    if (newPassword && newPassword.length >= 6) {
      try {
        await superAdminAPI.resetUserPassword(userId, newPassword);
        setMessage('Password reset successfully');
      } catch (err) {
        setError('Failed to reset password');
        console.error('Reset password error:', err);
      }
    }
  };

  const handleViewUser = (userId) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setShowUserModal(true);
    }
  };

  const handleDeleteUserGlobally = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const confirmMessage = `Are you sure you want to delete the user "${user.name}" (${user.email})?\n\nThis will permanently delete the user and all their data. The user must not have any assigned tasks.\n\nThis action cannot be undone.`;

    if (!confirm(confirmMessage)) return;

    try {
      setLoading(true);
      await superAdminAPI.deleteUserGlobally(userId);
      setMessage(`User "${user.name}" deleted successfully`);
      // Refresh the users list
      fetchUsers(1, userSearch, userRoleFilter);
    } catch (err) {
      setError('Failed to delete user');
      console.error('Delete user error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Security handlers
  const handleViewFailedLogins = async () => {
    try {
      setLoading(true);
      const response = await securityAPI.getFailedLogins({ days: 7, limit: 50 });
      setSecurityData(prev => ({ ...prev, failedLogins: response.data.data }));
      setMessage(`Found ${response.data.data.failedLogins.length} failed login attempts in the last 7 days`);
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      setError('Failed to fetch failed login data');
      console.error('Failed logins error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckSuspiciousActivity = async () => {
    try {
      setLoading(true);
      const response = await securityAPI.getSuspiciousActivity({ days: 7, limit: 50 });
      setSecurityData(prev => ({ ...prev, suspiciousActivity: response.data.data }));
      setMessage(`Found ${response.data.data.suspiciousActivity.length} suspicious activities in the last 7 days`);
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      setError('Failed to fetch suspicious activity data');
      console.error('Suspicious activity error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSecurityReport = async () => {
    try {
      setLoading(true);
      const response = await securityAPI.generateSecurityReport({ days: 30 });
      setSecurityData(prev => ({ ...prev, securityReport: response.data.data }));
      setMessage('Security report generated successfully');
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      setError('Failed to generate security report');
      console.error('Security report error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUserSessions = async () => {
    try {
      setLoading(true);
      const response = await securityAPI.getUserSessions({ days: 7, limit: 100 });
      setSecurityData(prev => ({ ...prev, userSessions: response.data.data }));
      setMessage(`Found ${response.data.data.userSessions.length} user sessions in the last 7 days`);
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      setError('Failed to fetch user sessions data');
      console.error('User sessions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAllPasswords = async () => {
    const newPassword = prompt('Enter new password for all users (minimum 6 characters):');
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    const confirmPassword = prompt('Confirm new password:');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (confirm('Are you sure you want to reset all user passwords? This will log out all users.')) {
      try {
        setLoading(true);
        const response = await securityAPI.resetAllPasswords({ 
          newPassword, 
          confirmPassword 
        });
        setMessage(`Successfully reset passwords for ${response.data.data.affectedUsers} users`);
        setTimeout(() => setMessage(null), 5000);
      } catch (err) {
        setError('Failed to reset all passwords');
        console.error('Reset all passwords error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLockSuspiciousAccounts = async () => {
    if (confirm('This will identify and lock accounts with suspicious activity. Continue?')) {
      try {
        setLoading(true);
        const response = await securityAPI.lockSuspiciousAccounts({ 
          days: 7, 
          failedLoginThreshold: 5 
        });
        setMessage(`Identified ${response.data.data.suspiciousUsers.length} suspicious accounts`);
        setTimeout(() => setMessage(null), 5000);
      } catch (err) {
        setError('Failed to lock suspicious accounts');
        console.error('Lock suspicious accounts error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Analytics data
  const [analyticsData, setAnalyticsData] = useState(null);

  // Analytics handlers
  const handleGenerateRevenueReport = () => {
    setMessage('Revenue report generation feature coming soon!');
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUserEngagementAnalysis = async () => {
    try {
      setLoading(true);
      const response = await superAdminAPI.getUserEngagementAnalytics({ days: 30 });
      setAnalyticsData(response.data.data);
      setMessage('User engagement analytics loaded successfully');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError('Failed to load user engagement analytics');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureUsageStatistics = () => {
    setMessage('Feature usage statistics feature coming soon!');
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExportAnalyticsData = () => {
    setMessage('Analytics data export feature coming soon!');
    setTimeout(() => setMessage(null), 3000);
  };

  const getHealthStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'fair': return 'text-yellow-500';
      case 'warning': return 'text-orange-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getHealthStatusBg = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'fair': return 'bg-yellow-500';
      case 'warning': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const StatCard = ({ title, value, icon, color = 'text-blue-500', bgColor = 'bg-blue-500' }) => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`text-3xl ${color}`}>{icon}</div>
      </div>
    </div>
  );

  const TabButton = ({ tab, label, icon }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        activeTab === tab
          ? 'bg-indigo-600 text-white'
          : 'text-gray-300 hover:bg-gray-700'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">SA</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Super Admin Dashboard</h1>
                <p className="text-sm text-gray-400">System-wide management and monitoring</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">Welcome, {user?.name}</span>
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-4">
            <TabButton tab="overview" label="System Overview" icon="📊" />
            <TabButton tab="companies" label="Companies" icon="🏢" />
            <TabButton tab="users" label="Users" icon="👥" />
            <TabButton tab="security" label="Security" icon="🔒" />
            <TabButton tab="analytics" label="Analytics" icon="📈" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="loading loading-spinner loading-lg text-indigo-600"></div>
          </div>
        )}

        {message && (
          <div className="bg-green-900 border border-green-700 text-green-100 px-4 py-3 rounded mb-6">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* System Overview Tab */}
        {activeTab === 'overview' && systemHealth && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">System Overview</h2>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Companies"
                value={systemHealth.overview.totalCompanies}
                icon="🏢"
                color="text-blue-500"
              />
              <StatCard
                title="Total Users"
                value={systemHealth.overview.totalUsers}
                icon="👥"
                color="text-green-500"
              />
              <StatCard
                title="Total Tasks"
                value={systemHealth.overview.totalTasks}
                icon="📋"
                color="text-purple-500"
              />
              <StatCard
                title="Recent Activity (30d)"
                value={systemHealth.overview.recentUsers}
                icon="📈"
                color="text-orange-500"
              />
            </div>

            {/* Company Health Status */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Company Health Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Healthy: {systemHealth.companyHealth.healthy}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-300">Warning: {systemHealth.companyHealth.warning}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-300">Critical: {systemHealth.companyHealth.critical}</span>
                </div>
              </div>
            </div>

            {/* Subscription Distribution */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Subscription Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {systemHealth.subscriptionDistribution.map((sub, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-white">{sub._count.subscriptionPlan}</div>
                    <div className="text-sm text-gray-400 capitalize">{sub.subscriptionPlan}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Companies Tab */}
        {activeTab === 'companies' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Companies</h2>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={companySearch}
                  onChange={(e) => handleCompanySearch(e.target.value)}
                  className="input bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-64"
                />
                <button
                  onClick={() => fetchCompanies(1, companySearch)}
                  className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Company Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{companies.length}</div>
                <div className="text-sm text-gray-400">Total Companies</div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-500">
                  {companies.filter(c => c.healthStatus === 'healthy').length}
                </div>
                <div className="text-sm text-gray-400">Healthy</div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-500">
                  {companies.filter(c => c.healthStatus === 'warning').length}
                </div>
                <div className="text-sm text-gray-400">Warning</div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-500">
                  {companies.filter(c => c.healthStatus === 'critical').length}
                </div>
                <div className="text-sm text-gray-400">Critical</div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="text-gray-300">Company</th>
                      <th className="text-gray-300">Users</th>
                      <th className="text-gray-300">Tasks</th>
                      <th className="text-gray-300">Health</th>
                      <th className="text-gray-300">Plan</th>
                      <th className="text-gray-300">Created</th>
                      <th className="text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => (
                      <tr key={company.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td>
                          <div>
                            <div className="font-medium text-white">{company.name}</div>
                            <div className="text-sm text-gray-400">{company.email}</div>
                            {company.isPersonal && (
                              <span className="badge badge-sm badge-info text-xs mt-1">Personal</span>
                            )}
                          </div>
                        </td>
                        <td className="text-gray-300">{company.userCount}</td>
                        <td className="text-gray-300">{company.taskCount}</td>
                        <td>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${getHealthStatusBg(company.healthStatus)}`}></div>
                            <span className={`text-sm ${getHealthStatusColor(company.healthStatus)}`}>
                              {company.healthScore}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge text-xs ${
                            company.subscriptionPlan === 'free' ? 'badge-outline' : 'badge-success'
                          }`}>
                            {company.subscriptionPlan}
                          </span>
                        </td>
                        <td className="text-gray-300">
                          {new Date(company.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="flex space-x-1">
                            <button
                              className="btn btn-sm btn-outline text-xs"
                              onClick={() => handleManageCompany(company.id)}
                            >
                              Manage
                            </button>
                            <button
                              className="btn btn-sm btn-error text-xs"
                              onClick={() => handleDeleteCompany(company.id)}
                              disabled={loading}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {companiesPagination.pages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <button
                  onClick={() => handleCompanyPageChange(companiesPagination.page - 1)}
                  disabled={companiesPagination.page === 1}
                  className="btn btn-sm bg-gray-700 hover:bg-gray-600 text-white border-0 disabled:opacity-50"
                >
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, companiesPagination.pages) }, (_, i) => {
                    const pageNum = Math.max(1, companiesPagination.page - 2) + i;
                    if (pageNum > companiesPagination.pages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handleCompanyPageChange(pageNum)}
                        className={`btn btn-sm ${
                          pageNum === companiesPagination.page
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                        } border-0`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handleCompanyPageChange(companiesPagination.page + 1)}
                  disabled={companiesPagination.page === companiesPagination.pages}
                  className="btn btn-sm bg-gray-700 hover:bg-gray-600 text-white border-0 disabled:opacity-50"
                >
                  Next
                </button>
                
                <div className="text-sm text-gray-400 ml-4">
                  Page {companiesPagination.page} of {companiesPagination.pages} 
                  ({companiesPagination.total} total companies)
                </div>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Global User Search</h2>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  className="input bg-gray-700 border-gray-600 text-white placeholder-gray-400 w-64"
                />
                <select 
                  value={userRoleFilter}
                  onChange={(e) => handleUserRoleFilter(e.target.value)}
                  className="select bg-gray-700 border-gray-600 text-white"
                >
                  <option value="">All Roles</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="SYSDMIN">SYSDMIN</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                </select>
                <button
                  onClick={() => fetchUsers(1, userSearch, userRoleFilter)}
                  className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* User Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{users.length}</div>
                <div className="text-sm text-gray-400">Total Users</div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-500">
                  {users.filter(u => u.isEmailVerified).length}
                </div>
                <div className="text-sm text-gray-400">Verified</div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-500">
                  {users.filter(u => !u.isEmailVerified).length}
                </div>
                <div className="text-sm text-gray-400">Unverified</div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-500">
                  {users.filter(u => u.role === 'SUPER_ADMIN').length}
                </div>
                <div className="text-sm text-gray-400">Super Admins</div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="text-gray-300">User</th>
                      <th className="text-gray-300">Company</th>
                      <th className="text-gray-300">Role</th>
                      <th className="text-gray-300">Verified</th>
                      <th className="text-gray-300">Created</th>
                      <th className="text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td>
                          <div>
                            <div className="font-medium text-white">{user.name}</div>
                            <div className="text-sm text-gray-400">{user.email}</div>
                          </div>
                        </td>
                        <td>
                          <div className="text-gray-300">{user.company.name}</div>
                          <div className="text-xs text-gray-400">{user.company.subscriptionPlan}</div>
                        </td>
                        <td>
                          <span className={`badge ${
                            user.role === 'SUPER_ADMIN' ? 'badge-error' :
                            user.role === 'SYSDMIN' ? 'badge-warning' :
                            user.role === 'ADMIN' ? 'badge-info' :
                            'badge-outline'
                          } text-xs`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            user.isEmailVerified ? 'badge-success' : 'badge-error'
                          } text-xs`}>
                            {user.isEmailVerified ? 'Verified' : 'Unverified'}
                          </span>
                        </td>
                        <td className="text-gray-300">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="flex space-x-1">
                            <button
                              className="btn btn-sm btn-outline text-xs"
                              onClick={() => handleResetPassword(user.id)}
                            >
                              Reset Password
                            </button>
                            <button
                              className="btn btn-sm btn-outline text-xs"
                              onClick={() => handleViewUser(user.id)}
                            >
                              View Details
                            </button>
                            <button
                              className="btn btn-sm btn-error text-xs"
                              onClick={() => handleDeleteUserGlobally(user.id)}
                              disabled={loading}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {usersPagination.pages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <button
                  onClick={() => handleUserPageChange(usersPagination.page - 1)}
                  disabled={usersPagination.page === 1}
                  className="btn btn-sm bg-gray-700 hover:bg-gray-600 text-white border-0 disabled:opacity-50"
                >
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, usersPagination.pages) }, (_, i) => {
                    const pageNum = Math.max(1, usersPagination.page - 2) + i;
                    if (pageNum > usersPagination.pages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handleUserPageChange(pageNum)}
                        className={`btn btn-sm ${
                          pageNum === usersPagination.page
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                        } border-0`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handleUserPageChange(usersPagination.page + 1)}
                  disabled={usersPagination.page === usersPagination.pages}
                  className="btn btn-sm bg-gray-700 hover:bg-gray-600 text-white border-0 disabled:opacity-50"
                >
                  Next
                </button>
                
                <div className="text-sm text-gray-400 ml-4">
                  Page {usersPagination.page} of {usersPagination.pages} 
                  ({usersPagination.total} total users)
                </div>
              </div>
            )}
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Security Dashboard</h2>
            
            {/* Security Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-500">
                  {securityData.failedLogins?.summary?.totalFailedLogins || 0}
                </div>
                <div className="text-sm text-gray-400">Failed Logins (7d)</div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-500">
                  {securityData.suspiciousActivity?.summary?.totalActivities || 0}
                </div>
                <div className="text-sm text-gray-400">Suspicious Activity</div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-500">
                  {securityData.securityReport?.securityMetrics?.failedLoginRate ? 
                    `${(100 - securityData.securityReport.securityMetrics.failedLoginRate).toFixed(1)}%` : 
                    '100%'
                  }
                </div>
                <div className="text-sm text-gray-400">System Health</div>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-500">
                  {securityData.userSessions?.summary?.activeUsers || 0}
                </div>
                <div className="text-sm text-gray-400">Active Users (24h)</div>
              </div>
            </div>

            {/* Security Alerts */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Security Events</h3>
              <div className="space-y-3">
                {securityData.suspiciousActivity?.suspiciousActivity?.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div>
                        <span className="text-yellow-300">{activity.action.replace(/_/g, ' ')}</span>
                        <div className="text-xs text-gray-400">
                          {activity.user?.name} - {new Date(activity.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(activity.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )) || (
                  <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-300">All systems secure</span>
                    </div>
                    <span className="text-xs text-gray-400">Just now</span>
                  </div>
                )}
                
                {(!securityData.suspiciousActivity?.suspiciousActivity || securityData.suspiciousActivity.suspiciousActivity.length === 0) && (
                  <div className="text-center text-gray-400 py-8">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <p>No security incidents detected</p>
                  </div>
                )}
              </div>
            </div>

            {/* Security Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">System Security</h3>
                <div className="space-y-3">
                  <button 
                    onClick={handleViewFailedLogins}
                    className="btn btn-outline w-full text-left"
                  >
                    🔒 View Failed Login Attempts
                  </button>
                  <button 
                    onClick={handleCheckSuspiciousActivity}
                    className="btn btn-outline w-full text-left"
                  >
                    🚨 Check Suspicious Activity
                  </button>
                  <button 
                    onClick={handleGenerateSecurityReport}
                    className="btn btn-outline w-full text-left"
                  >
                    📊 Generate Security Report
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">User Security</h3>
                <div className="space-y-3">
                  <button 
                    onClick={handleViewUserSessions}
                    className="btn btn-outline w-full text-left"
                  >
                    👥 View All User Sessions
                  </button>
                  <button 
                    onClick={handleResetAllPasswords}
                    className="btn btn-outline w-full text-left"
                  >
                    🔑 Reset All User Passwords
                  </button>
                  <button 
                    onClick={handleLockSuspiciousAccounts}
                    className="btn btn-outline w-full text-left"
                  >
                    🚫 Lock Suspicious Accounts
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
              <button
                onClick={handleUserEngagementAnalysis}
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load User Engagement Analytics'}
              </button>
            </div>

            {/* User Engagement Analytics */}
            {analyticsData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">User Activity</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">DAU (Today)</span>
                      <span className="text-white font-semibold">{analyticsData.userActivity.dailyActiveUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">WAU (7d)</span>
                      <span className="text-white font-semibold">{analyticsData.userActivity.weeklyActiveUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">MAU (30d)</span>
                      <span className="text-white font-semibold">{analyticsData.userActivity.monthlyActiveUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Retention (1w)</span>
                      <span className="text-white font-semibold">{analyticsData.userActivity.retentionRate}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Task Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Created ({analyticsData.timeRange})</span>
                      <span className="text-white font-semibold">{analyticsData.taskMetrics.totalTasksCreated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Completed</span>
                      <span className="text-white font-semibold">{analyticsData.taskMetrics.totalTasksCompleted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Completion Rate</span>
                      <span className="text-green-500 font-semibold">{analyticsData.taskMetrics.completionRate}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Growth Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">New Companies (30d)</span>
                      <span className="text-white font-semibold">+{systemHealth?.overview?.recentCompanies || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">New Users (30d)</span>
                      <span className="text-white font-semibold">+{analyticsData.growthMetrics.newUsersThisPeriod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">New Tasks (30d)</span>
                      <span className="text-white font-semibold">+{systemHealth?.overview?.recentTasks || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Subscription Analytics</h3>
                  <div className="space-y-3">
                    {systemHealth?.subscriptionDistribution?.slice(0, 3).map((sub, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-gray-400 capitalize">{sub.subscriptionPlan}</span>
                        <span className="text-white font-semibold">{sub._count.subscriptionPlan}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Feature Usage Statistics */}
            {analyticsData && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Feature Usage Statistics ({analyticsData.timeRange})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analyticsData.featureUsage.map((feature, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-4">
                      <div className="text-2xl font-bold text-white">{feature.count}</div>
                      <div className="text-sm text-gray-400 capitalize">{feature.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Charts Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Company Growth</h3>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p>Growth chart coming soon</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Activity Trends</h3>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <p>Activity chart coming soon</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Intelligence */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Business Intelligence</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={handleGenerateRevenueReport}
                  className="btn btn-outline w-full text-left opacity-50 cursor-not-allowed"
                  disabled
                >
                  📊 Generate Revenue Report
                  <div className="text-xs opacity-70">Coming Soon</div>
                </button>
                <button
                  onClick={handleUserEngagementAnalysis}
                  className="btn btn-outline w-full text-left"
                  disabled={loading}
                >
                  📈 User Engagement Analysis
                  <div className="text-xs opacity-70">Active</div>
                </button>
                <button
                  onClick={handleFeatureUsageStatistics}
                  className="btn btn-outline w-full text-left opacity-50 cursor-not-allowed"
                  disabled
                >
                  🎯 Feature Usage Statistics
                  <div className="text-xs opacity-70">Coming Soon</div>
                </button>
                <button
                  onClick={handleExportAnalyticsData}
                  className="btn btn-outline w-full text-left opacity-50 cursor-not-allowed"
                  disabled
                >
                  📋 Export Analytics Data
                  <div className="text-xs opacity-70">Coming Soon</div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedCompany && (
        <CompanyDetailsModal
          company={selectedCompany}
          isOpen={showCompanyModal}
          onClose={() => {
            setShowCompanyModal(false);
            setSelectedCompany(null);
            fetchCompanies(); // Refresh data
          }}
        />
      )}

      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
            fetchUsers(); // Refresh data
          }}
        />
      )}
    </div>
  );
};

export default SuperAdminDashboard;
