import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, Clock, Check, X, Eye, MapPin, 
  Building, Calendar, TrendingUp, AlertCircle 
} from 'lucide-react';
import { formatDate, formatRelativeTime, getRecruiterId, getTrustLevel } from '../utils/helpers';
import { applicationAPI } from '../services/api';

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const { data } = await applicationAPI.getMyApplications(params);
      if (data.success) {
        setApplications(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const withdrawApplication = async (applicationId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;

    try {
      const { data } = await applicationAPI.withdraw(applicationId);
      if (data.success) {
        fetchApplications();
      }
    } catch (error) {
      console.error('Failed to withdraw application:', error);
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
      shortlisted: TrendingUp,
      interviewed: Briefcase,
      offered: Check,
      rejected: X,
      hired: Check,
      withdrawn: AlertCircle
    };
    const Icon = icons[status] || Clock;
    return <Icon className="h-5 w-5" />;
  };

  const getStatusMessage = (status) => {
    const messages = {
      applied: 'Your application has been submitted',
      reviewed: 'Your application is under review',
      shortlisted: 'Congratulations! You\'ve been shortlisted',
      interviewed: 'Interview scheduled or completed',
      offered: 'Congratulations! You received an offer',
      rejected: 'Unfortunately, your application was not selected',
      hired: 'Congratulations! You\'ve been hired',
      withdrawn: 'You withdrew this application'
    };
    return messages[status] || 'Status unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
        <p className="text-gray-600">Track your job applications and their status</p>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <div className="card text-center">
          <Briefcase className="h-6 w-6 text-gray-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
          <p className="text-xs text-gray-600">Total</p>
        </div>
        <div className="card text-center">
          <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{statusCounts.applied || 0}</p>
          <p className="text-xs text-gray-600">Applied</p>
        </div>
        <div className="card text-center">
          <Eye className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{statusCounts.reviewed || 0}</p>
          <p className="text-xs text-gray-600">Reviewed</p>
        </div>
        <div className="card text-center">
          <TrendingUp className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{statusCounts.shortlisted || 0}</p>
          <p className="text-xs text-gray-600">Shortlisted</p>
        </div>
        <div className="card text-center">
          <Check className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{statusCounts.offered || 0}</p>
          <p className="text-xs text-gray-600">Offered</p>
        </div>
        <div className="card text-center">
          <X className="h-6 w-6 text-red-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{statusCounts.rejected || 0}</p>
          <p className="text-xs text-gray-600">Rejected</p>
        </div>
      </div>

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
              {status} {statusCounts[status] ? `(${statusCounts[status]})` : ''}
            </button>
          ))}
        </nav>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="card text-center py-12">
          <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h3>
          <p className="text-gray-600 mb-6">Start applying to jobs and track them here</p>
          <button
            onClick={() => navigate('/jobs')}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Briefcase className="h-5 w-5" />
            <span>Browse Jobs</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => {
            const job = application.jobId;
            const recruiter = application.recruiterId;
            const recruiterProfileId = getRecruiterId(recruiter);
            const trustLevel = recruiter?.trustScore ? getTrustLevel(recruiter.trustScore) : null;

            return (
              <div key={application._id} className="card hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 
                          className="text-xl font-semibold text-gray-900 hover:text-primary-600 cursor-pointer"
                          onClick={() => navigate(`/jobs/${job.id}`)}
                        >
                          {job.title}
                        </h3>
                        <div className="flex items-center space-x-2 text-gray-600 mt-1">
                          <Building className="h-4 w-4" />
                          <span>{job.company}</span>
                          {recruiterProfileId && (
                            <button
                              onClick={() => navigate(`/recruiter/${recruiterProfileId}`)}
                              className="text-primary-600 hover:text-primary-700 text-sm"
                            >
                              (View Recruiter)
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)} flex items-center space-x-1`}>
                          {getStatusIcon(application.status)}
                          <span className="capitalize">{application.status}</span>
                        </span>
                        {trustLevel && (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${trustLevel.bgColor} ${trustLevel.textColor}`}>
                            Trust: {recruiter.trustScore}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location?.city || job.location?.country}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Briefcase className="h-4 w-4" />
                        <span>{job.roleType}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Applied {formatRelativeTime(application.createdAt)}</span>
                      </div>
                    </div>

                    {/* Status Message */}
                    <div className={`p-3 rounded-lg mb-3 ${
                      ['offered', 'hired', 'shortlisted'].includes(application.status)
                        ? 'bg-green-50 border border-green-200'
                        : application.status === 'rejected'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-blue-50 border border-blue-200'
                    }`}>
                      <p className={`text-sm font-medium ${
                        ['offered', 'hired', 'shortlisted'].includes(application.status)
                          ? 'text-green-800'
                          : application.status === 'rejected'
                          ? 'text-red-800'
                          : 'text-blue-800'
                      }`}>
                        {getStatusMessage(application.status)}
                      </p>
                    </div>

                    {/* Timeline */}
                    {application.statusHistory && application.statusHistory.length > 1 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-3">Application Timeline:</p>
                        <div className="space-y-2">
                          {application.statusHistory.slice(0, 3).map((history, idx) => (
                            <div key={idx} className="flex items-center space-x-3 text-sm">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(history.status).split(' ')[0]}`}></div>
                              <span className="capitalize text-gray-700">{history.status}</span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-500">{formatDate(history.changedAt)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <button
                          onClick={() => navigate(`/jobs/${job.id}`)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      View Job
                    </button>
                    {recruiterProfileId && (
                      <button
                        onClick={() => navigate(`/recruiter/${recruiterProfileId}`)}
                        className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                      >
                        View Recruiter
                      </button>
                    )}
                  </div>
                  
                  {!['hired', 'offered', 'withdrawn'].includes(application.status) && (
                    <button
                      onClick={() => withdrawApplication(application._id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Withdraw Application
                    </button>
                  )}
                </div>

                {/* Interview Schedule */}
                {application.interviewSchedule && application.interviewSchedule.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 bg-yellow-50 -mx-6 -mb-6 px-6 py-4 rounded-b-xl">
                    <p className="text-sm font-semibold text-yellow-900 mb-3 flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Upcoming Interviews</span>
                    </p>
                    {application.interviewSchedule.map((interview, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-lg mb-2 last:mb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{interview.round}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(interview.scheduledAt).toLocaleString()}
                            </p>
                            {interview.duration && (
                              <p className="text-sm text-gray-600">{interview.duration} minutes</p>
                            )}
                            {interview.location && (
                              <p className="text-sm text-gray-600">{interview.location}</p>
                            )}
                          </div>
                          {interview.meetingLink && (
                            <a
                              href={interview.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-primary text-sm"
                            >
                              Join Meeting
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State with Call to Action */}
      {applications.length > 0 && statusFilter !== 'all' && applications.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">No applications with status: {statusFilter}</p>
          <button
            onClick={() => setStatusFilter('all')}
            className="btn-secondary"
          >
            View All Applications
          </button>
        </div>
      )}
    </div>
  );
};

export default MyApplications;
