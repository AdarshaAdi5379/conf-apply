import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Briefcase, DollarSign, Clock, Filter } from 'lucide-react';
import { getTrustLevel } from '../utils/helpers';
import { jobAPI } from '../services/api';

const BrowseJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    roleType: searchParams.get('roleType') || '',
    experienceLevel: searchParams.get('experienceLevel') || '',
    location: searchParams.get('location') || '',
    skills: searchParams.get('skills') || '',
    salaryMin: searchParams.get('salaryMin') || '',
    salaryMax: searchParams.get('salaryMax') || ''
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [searchParams]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = {};
      Object.keys(filters).forEach(key => {
        if (filters[key]) params[key] = filters[key];
      });
      const { data } = await jobAPI.getAll(params);
      if (data.success) {
        setJobs(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.set(key, filters[key]);
    });
    
    setSearchParams(params);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      roleType: '',
      experienceLevel: '',
      location: '',
      skills: '',
      salaryMin: '',
      salaryMax: ''
    });
    setSearchParams({});
  };

  const getDaysRemaining = (deadline) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Search Section */}
      <div className="bg-gradient-to-br from-primary-600 to-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Find Your Next Opportunity</h1>
          <p className="text-xl text-blue-100 mb-8">
            Browse {jobs.length}+ verified job listings from trusted recruiters
          </p>
          
          <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-xl p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Job title, company, or keywords..."
                  className="flex-1 bg-transparent outline-none text-gray-900"
                />
              </div>
              
              <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg md:w-64">
                <MapPin className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  placeholder="Location..."
                  className="flex-1 bg-transparent outline-none text-gray-900"
                />
              </div>
              
              <button type="submit" className="btn-primary whitespace-nowrap">
                Search Jobs
              </button>
              
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid md:grid-cols-3 gap-4">
                <select
                  value={filters.roleType}
                  onChange={(e) => handleFilterChange('roleType', e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="">All Role Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Remote">Remote</option>
                </select>

                <select
                  value={filters.experienceLevel}
                  onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="">All Experience Levels</option>
                  <option value="Entry Level">Entry Level</option>
                  <option value="Mid Level">Mid Level</option>
                  <option value="Senior Level">Senior Level</option>
                  <option value="Lead">Lead</option>
                  <option value="Executive">Executive</option>
                </select>

                <input
                  type="text"
                  value={filters.skills}
                  onChange={(e) => handleFilterChange('skills', e.target.value)}
                  placeholder="Skills (comma separated)"
                  className="input-field text-sm"
                />

                <input
                  type="number"
                  value={filters.salaryMin}
                  onChange={(e) => handleFilterChange('salaryMin', e.target.value)}
                  placeholder="Min Salary"
                  className="input-field text-sm"
                />

                <input
                  type="number"
                  value={filters.salaryMax}
                  onChange={(e) => handleFilterChange('salaryMax', e.target.value)}
                  placeholder="Max Salary"
                  className="input-field text-sm"
                />

                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Jobs List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {jobs.length} Jobs Found
          </h2>
          <select className="input-field w-48">
            <option>Most Recent</option>
            <option>Highest Salary</option>
            <option>Most Relevant</option>
            <option>Ending Soon</option>
          </select>
        </div>

        {jobs.length === 0 ? (
          <div className="card text-center py-12">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search filters</p>
            <button onClick={clearFilters} className="btn-primary">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {jobs.map((job) => {
              const daysRemaining = getDaysRemaining(job.applicationDeadline);
              const trustLevel = job.recruiterId?.trustScore 
                ? getTrustLevel(job.recruiterId.trustScore) 
                : null;

              return (
                <div
                  key={job._id}
                  onClick={() => navigate(`/jobs/${job._id}`)}
                  className="card hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 hover:text-primary-600 mb-1">
                            {job.title}
                          </h3>
                          <p className="text-gray-700 font-medium">{job.company}</p>
                        </div>
                        
                        {trustLevel && (
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${trustLevel.bgColor} ${trustLevel.textColor}`}>
                            Trust: {job.recruiterId.trustScore}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {job.location.isRemote 
                              ? 'Remote' 
                              : `${job.location.city || job.location.country}`}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Briefcase className="h-4 w-4" />
                          <span>{job.roleType}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-4 w-4" />
                          <span>
                            ${job.salaryRange.min.toLocaleString()} - ${job.salaryRange.max.toLocaleString()} {job.salaryRange.period}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span className={daysRemaining <= 3 ? 'text-red-600 font-medium' : ''}>
                            {daysRemaining} days left
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4 line-clamp-2">
                        {job.description}
                      </p>

                      {job.requiredSkills && job.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {job.requiredSkills.slice(0, 6).map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {job.requiredSkills.length > 6 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{job.requiredSkills.length - 6} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/jobs/${job._id}`);
                      }}
                      className="btn-primary text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseJobs;
