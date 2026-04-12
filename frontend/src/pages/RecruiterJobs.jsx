import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Briefcase, Eye, Users, Edit, Trash2, Copy } from 'lucide-react';
import CreateJobForm from '../components/CreateJobForm';
import { jobAPI } from '../services/api';

const RecruiterJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const fetchJobs = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const { data } = await jobAPI.getMyJobs(params);
      if (data.success) {
        setJobs(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;

    try {
      const { data } = await jobAPI.delete(jobId);
      if (data.success) {
        fetchJobs();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const handleDuplicate = async (jobId) => {
    try {
      const { data } = await jobAPI.duplicate(jobId);
      if (data.success) {
        fetchJobs();
      }
    } catch (error) {
      console.error('Failed to duplicate job:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      paused: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-red-100 text-red-800',
      filled: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Job Postings</h1>
          <p className="text-gray-600 mt-2">Manage your job listings and track applications</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Post New Job</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {['all', 'active', 'draft', 'paused', 'closed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors capitalize ${
                statusFilter === status
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {status}
            </button>
          ))}
        </nav>
      </div>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div className="card text-center py-12">
          <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600 mb-6">Start by creating your first job posting</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Create Job</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {jobs.map((job) => (
            <div key={job._id} className="card hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                    <span>📍 {job.location.city || job.location.country}</span>
                    <span>💼 {job.roleType}</span>
                    <span>💰 ${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max.toLocaleString()}</span>
                    <span>📅 {new Date(job.applicationDeadline).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Users className="h-4 w-4" />
                      <span>{job.applicationCount || 0} Applications</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Eye className="h-4 w-4" />
                      <span>{job.viewCount || 0} Views</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Briefcase className="h-4 w-4" />
                      <span>{job.vacancies} Openings</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/jobs/${job._id}/applications`)}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="View Applications"
                  >
                    <Users className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingJob(job);
                      setShowCreateForm(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(job._id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(job._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Skills Tags */}
              {job.requiredSkills && job.requiredSkills.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {job.requiredSkills.slice(0, 5).map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-primary-50 text-primary-700 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills.length > 5 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{job.requiredSkills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Job Modal */}
      {showCreateForm && (
        <CreateJobForm
          editJob={editingJob}
          onClose={() => {
            setShowCreateForm(false);
            setEditingJob(null);
          }}
          onSuccess={() => {
            fetchJobs();
            setEditingJob(null);
          }}
        />
      )}
    </div>
  );
};

export default RecruiterJobs;