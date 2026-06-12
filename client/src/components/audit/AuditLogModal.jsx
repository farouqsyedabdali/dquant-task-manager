import { useState, useEffect } from 'react';
import { auditAPI } from '../../services/api';
import useAuthStore from '../../context/authStore';
import DatePicker from '../common/DatePicker';

const AuditLogModal = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    action: '',
    entityType: '',
    userId: '',
    search: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [stats, setStats] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SYSDMIN';

  useEffect(() => {
    if (isOpen && isAdmin) {
      fetchAuditLogs();
      fetchStats();
    }
  }, [isOpen, isAdmin, filters]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        ...filters,
        page: filters.page,
        limit: filters.limit
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await auditAPI.getAuditLogs(params);
      
      if (response.data.success) {
        setAuditLogs(response.data.data.auditLogs);
        setPagination(response.data.data.pagination);
        setStats(response.data.data.stats || []);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await auditAPI.getAuditStats({ days: 30 });
      if (response.data.success) {
        setStats(response.data.data.actionStats || []);
      }
    } catch (err) {
      console.error('Error fetching audit stats:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleExport = async () => {
    try {
      const params = { ...filters };
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await auditAPI.exportAuditLogs(params);
      
      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting audit logs:', err);
      // Toast will be handled by parent component or we can add toast here
      console.error('Failed to export audit logs');
    }
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      action: '',
      entityType: '',
      userId: '',
      search: '',
      startDate: '',
      endDate: ''
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionColor = (action) => {
    const colors = {
      'TASK_CREATED': 'text-green-400',
      'TASK_UPDATED': 'text-blue-400',
      'TASK_DELETED': 'text-red-400',
      'TASK_STATUS_CHANGED': 'text-yellow-400',
      'COMMENT_CREATED': 'text-green-400',
      'COMMENT_UPDATED': 'text-blue-400',
      'COMMENT_DELETED': 'text-red-400',
      'USER_CREATED': 'text-green-400',
      'USER_UPDATED': 'text-blue-400',
      'USER_DELETED': 'text-red-400',
      'CO_ASSIGNEE_ADDED': 'text-purple-400',
      'CO_ASSIGNEE_REMOVED': 'text-orange-400',
      'USER_LOGIN': 'text-cyan-400',
      'USER_LOGOUT': 'text-gray-400'
    };
    return colors[action] || 'text-gray-400';
  };

  if (!isOpen) return null;

  if (!isAdmin) {
    return (
      <div className="modal modal-open backdrop-blur-sm animate-fadeIn">
        <div 
          className="modal-box border"
          style={{ 
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)'
          }}
        >
          <h3 
            className="font-bold text-lg mb-4"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Access Denied
          </h3>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            You don't have permission to view audit logs.
          </p>
          <div className="modal-action">
            <button 
              className="btn border-0"
              style={{ 
                backgroundColor: 'var(--color-primary)',
                color: 'white'
              }}
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal modal-open backdrop-blur-sm animate-fadeIn">
      <div 
        className="modal-box max-w-6xl border"
        style={{ 
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)'
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 
            className="font-bold text-xl"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Audit Log
          </h3>
          <div className="flex space-x-2">
            <button
              className="btn btn-sm btn-outline"
              style={{ 
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-secondary)'
              }}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button
              className="btn btn-sm border-0"
              style={{ 
                backgroundColor: 'var(--color-primary)',
                color: 'white'
              }}
              onClick={handleExport}
              disabled={loading}
            >
              Export CSV
            </button>
            <button 
              className="btn btn-sm btn-ghost"
              style={{ color: 'var(--color-text-tertiary)' }}
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div 
            className="p-4 rounded-lg mb-6"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="label">
                  <span 
                    className="label-text"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Search
                  </span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="Search descriptions..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              
              <div>
                <label className="label">
                  <span 
                    className="label-text"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Action
                  </span>
                </label>
                <select
                  className="select select-bordered w-full"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                  }}
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                >
                  <option value="">All Actions</option>
                  <option value="TASK_CREATED">Task Created</option>
                  <option value="TASK_UPDATED">Task Updated</option>
                  <option value="TASK_DELETED">Task Deleted</option>
                  <option value="TASK_STATUS_CHANGED">Status Changed</option>
                  <option value="COMMENT_CREATED">Comment Created</option>
                  <option value="COMMENT_UPDATED">Comment Updated</option>
                  <option value="COMMENT_DELETED">Comment Deleted</option>
                  <option value="USER_CREATED">User Created</option>
                  <option value="USER_UPDATED">User Updated</option>
                  <option value="USER_DELETED">User Deleted</option>
                  <option value="CO_ASSIGNEE_ADDED">Co-assignee Added</option>
                  <option value="CO_ASSIGNEE_REMOVED">Co-assignee Removed</option>
                  <option value="USER_LOGIN">User Login</option>
                  <option value="USER_LOGOUT">User Logout</option>
                </select>
              </div>

              <div>
                <label className="label">
                  <span 
                    className="label-text"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Entity Type
                  </span>
                </label>
                <select
                  className="select select-bordered w-full"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border-default)',
                    color: 'var(--color-text-primary)',
                  }}
                  value={filters.entityType}
                  onChange={(e) => handleFilterChange('entityType', e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="Task">Task</option>
                  <option value="Comment">Comment</option>
                  <option value="User">User</option>
                  <option value="CoAssignee">Co-assignee</option>
                </select>
              </div>

              <div>
                <label className="label">
                  <span 
                    className="label-text"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Start Date
                  </span>
                </label>
                <DatePicker
                  name="startDate"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  placeholder="Start date"
                  showTime={false}
                  timeOptional={false}
                />
              </div>

              <div>
                <label className="label">
                  <span 
                    className="label-text"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    End Date
                  </span>
                </label>
                <DatePicker
                  name="endDate"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  placeholder="End date"
                  showTime={false}
                  timeOptional={false}
                  min={filters.startDate || undefined}
                />
              </div>

              <div className="flex items-end">
                <button
                  className="btn btn-sm btn-outline"
                  style={{ 
                    borderColor: 'var(--color-border-default)',
                    color: 'var(--color-text-secondary)'
                  }}
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        {stats.length > 0 && (
          <div 
            className="p-4 rounded-lg mb-6"
            style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
          >
            <h4 
              className="font-semibold mb-3"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Action Summary (Last 30 Days)
            </h4>
            <div className="flex flex-wrap gap-2">
              {stats.slice(0, 10).map((stat, index) => (
                <div 
                  key={index} 
                  className="badge badge-outline"
                  style={{ 
                    borderColor: 'var(--color-border-default)',
                    color: 'var(--color-text-secondary)'
                  }}
                >
                  {stat.action.replace(/_/g, ' ')}: {stat.count}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {/* Audit Logs */}
        {!loading && !error && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {auditLogs.length === 0 ? (
              <div 
                className="text-center py-8"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                No audit logs found
              </div>
            ) : (
              auditLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`font-semibold ${getActionColor(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span 
                        className="text-sm"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        by {log.user.name}
                      </span>
                    </div>
                    <span 
                      className="text-sm"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                  
                  <p 
                    className="text-sm mb-2"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {log.description}
                  </p>
                  
                  <div 
                    className="flex items-center space-x-4 text-xs"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    <span>Entity: {log.entityType}</span>
                    {log.entityId && <span>ID: {log.entityId}</span>}
                    <span>Role: {log.user.role}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-6">
            <button
              className="btn btn-sm btn-outline"
              style={{ 
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-secondary)'
              }}
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </button>
            
            <span style={{ color: 'var(--color-text-primary)' }}>
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </span>
            
            <button
              className="btn btn-sm btn-outline"
              style={{ 
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-secondary)'
              }}
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogModal;
