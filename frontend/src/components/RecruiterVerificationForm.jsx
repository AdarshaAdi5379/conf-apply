import { useState } from 'react';
import { recruiterAPI } from '../services/api';
import { Search, Loader } from 'lucide-react';
import TrustScoreDashboard from './TrustScoreDashboard';

const RecruiterVerificationForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    linkedInUrl: '',
    companyWebsite: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await recruiterAPI.verify(formData);
      setResult(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Verify Recruiter Authenticity</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recruiter Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="john@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              required
              className="input-field"
              placeholder="TechCorp Inc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LinkedIn Profile URL (Optional)
            </label>
            <input
              type="url"
              name="linkedInUrl"
              value={formData.linkedInUrl}
              onChange={handleChange}
              className="input-field"
              placeholder="https://linkedin.com/in/name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Website (Optional)
            </label>
            <input
              type="url"
              name="companyWebsite"
              value={formData.companyWebsite}
              onChange={handleChange}
              className="input-field"
              placeholder="https://company.com"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                <span>Verify Recruiter</span>
              </>
            )}
          </button>
        </form>
      </div>

      {result && (
        <div className="mt-6">
          <TrustScoreDashboard data={result} />
        </div>
      )}
    </div>
  );
};

export default RecruiterVerificationForm;