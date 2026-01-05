import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { projectsAPI, usersAPI } from '../services/api';
import useAuthStore from '../context/authStore';
import CreateProjectModal from '../components/projects/CreateProjectModal';
import ProjectDetailModal from '../components/projects/ProjectDetailModal';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ACTIVE');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { user } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    fetchProjects();
  }, [filterStatus]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle navigation from TaskModal with project ID
  useEffect(() => {
    if (location.state?.openProjectId && projects.length > 0) {
      const projectToOpen = projects.find(p => p.id === location.state.openProjectId);
      if (projectToOpen) {
        handleOpenProject(projectToOpen);
        // Clear the state so it doesn't reopen on subsequent renders
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, projects]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const params = filterStatus !== 'ALL' ? { status: filterStatus } : {};
      const response = await projectsAPI.getAll(params);
      setProjects(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectCreated = (newProject) => {
    setProjects(prev => [newProject, ...prev]);
    setIsCreateModalOpen(false);
    setSuccessMessage('Project created successfully!');
  };

  const handleProjectUpdated = (updatedProject) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    setSuccessMessage('Project updated successfully!');
  };

  const handleProjectDeleted = (projectId) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setIsDetailModalOpen(false);
    setSelectedProject(null);
    setSuccessMessage('Project deleted successfully!');
  };

  const handleOpenProject = (project) => {
    setSelectedProject(project);
    setIsDetailModalOpen(true);
  };

  const filteredProjects = projects.filter(project => {
    if (!searchTerm) return true;
    return project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           project.description?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'ON_HOLD': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'COMPLETED': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'ARCHIVED': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Projects and Events
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Organize your work with projects containing multiple tasks
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input input-bordered w-full"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>

          {/* Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="select select-bordered"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)',
            }}
          >
            <option value="ALL">All Projects and Events</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Create Project Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Project
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="alert alert-success mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage('')} className="btn btn-sm btn-ghost">✕</button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="alert alert-error mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="btn btn-sm btn-ghost">✕</button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => handleOpenProject(project)}
                className="rounded-xl p-6 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-xl group"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border-default)',
                  borderWidth: 1,
                }}
              >
                {/* Project Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ backgroundColor: project.color + '20' }}
                    >
                      {project.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-lg font-semibold truncate group-hover:text-indigo-400 transition-colors"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {project.name}
                      </h3>
                      <p
                        className="text-sm truncate"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        {project.owner?.name}
                      </p>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${getStatusColor(project.status)}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Description */}
                {project.description && (
                  <p
                    className="text-sm mb-4 line-clamp-2"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {project.description}
                  </p>
                )}

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: 'var(--color-text-tertiary)' }}>Progress</span>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{project.progress}%</span>
                  </div>
                  <div 
                    className="w-full h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${project.progress}%`,
                        backgroundColor: project.color
                      }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                  <div className="flex items-center space-x-4">
                    {/* Tasks Count */}
                    <div className="flex items-center space-x-1" style={{ color: 'var(--color-text-tertiary)' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <span className="text-sm">{project.completedTasks}/{project.totalTasks}</span>
                    </div>

                    {/* Members Count */}
                    <div className="flex items-center space-x-1" style={{ color: 'var(--color-text-tertiary)' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="text-sm">{project._count?.members || 1}</span>
                    </div>
                  </div>

                  {/* Owner indicator */}
                  {project.isOwner && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/20 text-indigo-400">
                      Owner
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredProjects.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              No projects yet
            </h3>
            <p
              className="mb-6 max-w-md mx-auto"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {searchTerm 
                ? 'No projects match your search. Try different keywords.'
                : 'Create your first project to organize tasks and collaborate with your team.'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Your First Project
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}

      {/* Project Detail Modal */}
      {isDetailModalOpen && selectedProject && (
        <ProjectDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedProject(null);
          }}
          projectId={selectedProject.id}
          onProjectUpdated={handleProjectUpdated}
          onProjectDeleted={handleProjectDeleted}
        />
      )}
    </div>
  );
};

export default Projects;


