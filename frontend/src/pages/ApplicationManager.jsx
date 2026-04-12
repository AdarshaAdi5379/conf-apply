import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, Eye, Check, X, Clock, 
  UserCheck, Star, MessageSquare, Calendar 
} from 'lucide-react';
import { formatDate, formatRelativeTime } from '../utils/helpers';
import { jobAPI, applicationAPI } from '../services/api';

const ApplicationManager = () => {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [statusBreakdown, setStatusBreakdown] = useState([]);

  useEffect(() => {
    fetchApplications();
    fetchJobDetails();
  }, [jobId, statusFilter]);

  const fetchJobDetails = async () => {
    try {
      const { data } = await jobAPI.getById(jobId);
      if (data.success) {
        setJob(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch job details:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const { data } = await applicationAPI.getJobApplications(jobId, params);
      if (data.success) {
        setApplications(data.data);
        setStatusBreakdown(data.statusBreakdown || []);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      const { data } = await applicationAPI.updateStatus(applicationId, { status: newStatus });
      if (data.success) {
        fetchApplications();
        setSelectedApplication(null);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      applied: 'bg-blue-100 text-blue-800',
      reviewed: 'bg-purple-100 text-purple-800',
      shortlisted: 'bg-yellow-100 text-yellow-800',
      interviewed: 'bg-orange-100 text-orange-800',
      offered: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800',
      hired: 'bg-emerald-100 text-emerald-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      applied: Clock,
      reviewed: Eye,
      shortlisted: Star,
      interviewed: MessageSquare,
      offered: Check,
      rejected: X,
      hired: UserCheck
    };
    return icons[status] || Clock;
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
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/recruiter/jobs')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Jobs</span>
        </button>

        {job && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Applications for: {job.title}
            </h1>
            <p className="text-gray-600">
              {applications.length} total applications
            </p>
          </div>
        )}
      </div>

      {/* Status Breakdown Cards */}
      {statusBreakdown.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          {statusBreakdown.map((item) => {
            const Icon = getStatusIcon(item._id);
            return (
              <div
                key={item._id}
                className="card text-center cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setStatusFilter(item._id)}
              >
                <Icon className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                <p className="text-xs text-gray-600 capitalize">{item._id}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8 overflow-x-auto">
          {['all', 'applied', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'rejected', 'hired'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors capitalize whitespace-nowrap ${
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

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="card text-center py-12">
          <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h3>
          <p className="text-gray-600">Applications will appear here once candidates apply</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map((application) => (
            <div
              key={application._id}
              className="card hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedApplication(application)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {application.candidateId?.name || 'Anonymous'}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                      {application.status}
                    </span>
                    {!application.viewed && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                        New
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                    <span>📧 {application.candidateId?.email}</span>
                    {application.phone && <span>📱 {application.phone}</span>}
                    <span>🕒 Applied {formatRelativeTime(application.createdAt)}</span>
                    <span>⏰ {application.availability}</span>
                  </div>

                  {application.coverLetter && (
                    <p className="text-gray-700 text-sm line-clamp-2 mb-3">
                      {application.coverLetter}
                    </p>
                  )}

                  <div className="flex space-x-2">
                    {application.linkedIn && (
                      <a
                        href={application.linkedIn}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 hover:text-blue-700 text-xs"
                      >
                        LinkedIn
                      </a>
                    )}
                    {application.github && (
                      <a
                        href={application.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-600 hover:text-gray-700 text-xs"
                      >
                        GitHub
                      </a>
                    )}
                    {application.portfolio && (
                      <a
                        href={application.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-purple-600 hover:text-purple-700 text-xs"
                      >
                        Portfolio
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  {application.resume && (
                    <a
                      href={`${import.meta.env.VITE_API_URL.replace('/api', '')}/${application.resume.filepath}`}
                      download
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Download Resume"
                    >
                      <Download className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedApplication.candidateId?.name}
              </h2>
              <button
                onClick={() => setSelectedApplication(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Current Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Status
                </label>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedApplication.status)}`}>
                  {selectedApplication.status}
                </span>
              </div>

              {/* Update Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Status
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {['reviewed', 'shortlisted', 'interviewed', 'offered', 'rejected', 'hired'].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateApplicationStatus(selectedApplication._id, status)}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors capitalize ${
                        selectedApplication.status === status
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cover Letter */}
              {selectedApplication.coverLetter && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Cover Letter</h3>
                  <p className="text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-lg">
                    {selectedApplication.coverLetter}
                  </p>
                </div>
              )}

              {/* Contact Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium">{selectedApplication.candidateId?.email}</span>
                  </div>
                  {selectedApplication.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone</span>
                      <span className="font-medium">{selectedApplication.phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Availability</span>
                    <span className="font-medium">{selectedApplication.availability}</span>
                  </div>
                  {selectedApplication.expectedSalary?.amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expected Salary</span>
                      <span className="font-medium">
                        {selectedApplication.expectedSalary.currency} {selectedApplication.expectedSalary.amount.toLocaleString()}
                        {selectedApplication.expectedSalary.negotiable && ' (Negotiable)'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Links */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Links</h3>
                <div className="space-y-2">
                  {selectedApplication.linkedIn && (
                    <a
                      href={selectedApplication.linkedIn}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-primary-600 hover:text-primary-700"
                    >
                      LinkedIn Profile →
                    </a>
                  )}
                  {selectedApplication.github && (
                    <a
                      href={selectedApplication.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-primary-600 hover:text-primary-700"
                    >
                      GitHub Profile →
                    </a>
                  )}
                  {selectedApplication.portfolio && (
                    <a
                      href={selectedApplication.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-primary-600 hover:text-primary-700"
                    >
                      Portfolio →
                    </a>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                {selectedApplication.resume && (
                  <a
                    href={`${import.meta.env.VITE_API_URL.replace('/api', '')}/${selectedApplication.resume.filepath}`}
                    download
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Download className="h-5 w-5" />
                    <span>Download Resume</span>
                  </a>
                )}
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationManager;