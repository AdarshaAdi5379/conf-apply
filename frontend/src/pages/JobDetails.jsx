import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  MapPin, Briefcase, DollarSign, Clock, Building, Calendar,
  Users, BookOpen, Award, TrendingUp, ExternalLink, ArrowLeft
} from 'lucide-react';
import { getTrustLevel, formatDate } from '../utils/helpers';

const JobDetails = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    portfolio: '',
    linkedIn: '',
    github: '',
    phone: '',
    availability: 'Immediate',
    expectedSalary: { amount: '', currency: 'USD', negotiable: true }
  });
  const [resume, setResume] = useState(null);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/jobs/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setJob(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch job details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);

    try {
      const formData = new FormData();
      formData.append('jobId', id);
      
      Object.keys(applicationData).forEach(key => {
        if (key === 'expectedSalary') {
          formData.append(key, JSON.stringify(applicationData[key]));
        } else {
          formData.append(key, applicationData[key]);
        }
      });

      if (resume) {
        formData.append('resume', resume);
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/applications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert('Application submitted successfully!');
        setShowApplicationForm(false);
        navigate('/my-applications');
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert('Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card text-center">
          <p className="text-red-600">Job not found</p>
        </div>
      </div>
    );
  }

  const trustLevel = job.recruiterId?.trustScore 
    ? getTrustLevel(job.recruiterId.trustScore) 
    : null;

  const daysRemaining = Math.max(0, Math.ceil(
    (new Date(job.applicationDeadline) - new Date()) / (1000 * 60 * 60 * 24)
  ));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/jobs')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Jobs</span>
          </button>

          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <div className="flex items-center space-x-4 text-gray-600 mb-4">
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span className="font-medium">{job.company}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>
                    {job.location.isRemote ? 'Remote' : `${job.location.city || job.location.country}`}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                  {job.roleType}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {job.experienceLevel}
                </span>
                {trustLevel && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${trustLevel.bgColor} ${trustLevel.textColor}`}>
                    Recruiter Trust: {job.recruiterId.trustScore}
                  </span>
                )}
              </div>
            </div>

            {isAuthenticated && user?.role === 'candidate' && !showApplicationForm && (
              <button
                onClick={() => setShowApplicationForm(true)}
                className="btn-primary text-lg px-8 py-3"
              >
                Apply Now
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card text-center">
                <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Salary</p>
                <p className="font-semibold text-gray-900">
                  ${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max.toLocaleString()}
                </p>
              </div>
              <div className="card text-center">
                <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Deadline</p>
                <p className="font-semibold text-gray-900">{daysRemaining} days left</p>
              </div>
              <div className="card text-center">
                <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Openings</p>
                <p className="font-semibold text-gray-900">{job.vacancies}</p>
              </div>
              <div className="card text-center">
                <TrendingUp className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Applicants</p>
                <p className="font-semibold text-gray-900">{job.applicationCount || 0}</p>
              </div>
            </div>

            {/* Description */}
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Job Description</h2>
              <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
            </div>

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Responsibilities</h2>
                <ul className="space-y-2">
                  {job.responsibilities.map((resp, idx) => (
                    <li key={idx} className="flex items-start space-x-3">
                      <span className="text-primary-600 mt-1">•</span>
                      <span className="text-gray-700">{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Required Skills */}
            {job.requiredSkills && job.requiredSkills.length > 0 && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preferred Skills */}
            {job.preferredSkills && job.preferredSkills.length > 0 && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Preferred Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.preferredSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="card">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Benefits</h2>
                <div className="grid md:grid-cols-2 gap-3">
                  {job.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start space-x-3">
                      <Award className="h-5 w-5 text-green-600 mt-0.5" />
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Application Form */}
            {showApplicationForm && isAuthenticated && user?.role === 'candidate' && (
              <div className="card sticky top-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Apply for this Job</h3>
                <form onSubmit={handleApply} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Resume * (PDF, DOC, DOCX - Max 5MB)
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setResume(e.target.files[0])}
                      required
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cover Letter
                    </label>
                    <textarea
                      value={applicationData.coverLetter}
                      onChange={(e) => setApplicationData({...applicationData, coverLetter: e.target.value})}
                      rows={4}
                      className="input-field resize-none"
                      placeholder="Why are you a great fit for this role?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={applicationData.phone}
                      onChange={(e) => setApplicationData({...applicationData, phone: e.target.value})}
                      className="input-field"
                      placeholder="+1 234 567 8900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      value={applicationData.linkedIn}
                      onChange={(e) => setApplicationData({...applicationData, linkedIn: e.target.value})}
                      className="input-field"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GitHub (if applicable)
                    </label>
                    <input
                      type="url"
                      value={applicationData.github}
                      onChange={(e) => setApplicationData({...applicationData, github: e.target.value})}
                      className="input-field"
                      placeholder="https://github.com/yourusername"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Availability
                    </label>
                    <select
                      value={applicationData.availability}
                      onChange={(e) => setApplicationData({...applicationData, availability: e.target.value})}
                      className="input-field"
                    >
                      <option value="Immediate">Immediate</option>
                      <option value="2 weeks">2 weeks</option>
                      <option value="1 month">1 month</option>
                      <option value="2 months">2 months</option>
                      <option value="3+ months">3+ months</option>
                    </select>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowApplicationForm(false)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={applying}
                      className="btn-primary flex-1"
                    >
                      {applying ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Company Info */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">About the Company</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Company</p>
                  <p className="font-semibold text-gray-900">{job.company}</p>
                </div>
                {job.recruiterId && (
                  <div>
                    <p className="text-sm text-gray-600">Recruiter</p>
                    <button
                      onClick={() => navigate(`/recruiter/${job.recruiterId._id}`)}
                      className="font-semibold text-primary-600 hover:text-primary-700 flex items-center space-x-1"
                    >
                      <span>{job.recruiterId.name}</span>
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Job Details */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Job Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Job Type</span>
                  <span className="font-medium text-gray-900">{job.roleType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Work Mode</span>
                  <span className="font-medium text-gray-900">{job.workMode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Experience</span>
                  <span className="font-medium text-gray-900">{job.experienceLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Education</span>
                  <span className="font-medium text-gray-900">{job.education}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Posted</span>
                  <span className="font-medium text-gray-900">{formatDate(job.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Deadline</span>
                  <span className="font-medium text-red-600">{formatDate(job.applicationDeadline)}</span>
                </div>
              </div>
            </div>

            {/* Contact */}
            {job.contactEmail && (
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Contact</h3>
                <a
                  href={`mailto:${job.contactEmail}`}
                  className="text-primary-600 hover:text-primary-700 text-sm"
                >
                  {job.contactEmail}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;