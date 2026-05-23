import { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { jobAPI } from '../services/api';

const CreateJobForm = ({ onClose, onSuccess, editJob = null }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState(editJob || {
    title: '',
    company: '',
    roleType: 'Full-time',
    workMode: 'On-site',
    salaryRange: { min: '', max: '', currency: 'USD', period: 'yearly' },
    description: '',
    responsibilities: [''],
    requiredSkills: [''],
    preferredSkills: [''],
    location: { city: '', state: '', country: '', isRemote: false },
    experienceLevel: 'Mid',
    experienceYears: { min: 0, max: 5 },
    education: 'Bachelor',
    applicationDeadline: '',
    vacancies: 1,
    benefits: [''],
    contactEmail: '',
    status: 'active'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: type === 'checkbox' ? checked : value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const addArrayField = (field) => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeArrayField = (field, index) => {
    const newArray = formData[field].filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, [field]: newArray.length ? newArray : [''] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Clean up empty array fields
      const cleanedData = {
        ...formData,
        responsibilities: formData.responsibilities.filter(r => r.trim()),
        requiredSkills: formData.requiredSkills.filter(s => s.trim()),
        preferredSkills: formData.preferredSkills.filter(s => s.trim()),
        benefits: formData.benefits.filter(b => b.trim())
      };

      const { data } = editJob
        ? await jobAPI.update(editJob._id, cleanedData)
        : await jobAPI.create(cleanedData);

      if (!data.success) {
        throw new Error(data.error || 'Failed to save job');
      }

      onSuccess(data.data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {editJob ? 'Edit Job Posting' : 'Create New Job Posting'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="Senior Software Engineer"
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
                  placeholder="Tech Corp"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Type *
                </label>
                <select name="roleType" value={formData.roleType} onChange={handleChange} className="input-field">
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Mode *
                </label>
                <select name="workMode" value={formData.workMode} onChange={handleChange} className="input-field">
                  <option value="On-site">On-site</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>
          </div>

          {/* Salary Range */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Salary Range</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min *</label>
                <input
                  type="number"
                  name="salaryRange.min"
                  value={formData.salaryRange.min}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="50000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max *</label>
                <input
                  type="number"
                  name="salaryRange.max"
                  value={formData.salaryRange.max}
                  onChange={handleChange}
                  required
                  className="input-field"
                  placeholder="100000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <select name="salaryRange.currency" value={formData.salaryRange.currency} onChange={handleChange} className="input-field">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                  <option value="CAD">CAD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                <select name="salaryRange.period" value={formData.salaryRange.period} onChange={handleChange} className="input-field">
                  <option value="hourly">Hourly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description * (Min 50 characters)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              minLength={50}
              rows={6}
              className="input-field resize-none"
              placeholder="Describe the role, responsibilities, and what makes this opportunity great..."
            />
            <p className="text-xs text-gray-500 mt-1">{formData.description.length} characters</p>
          </div>

          {/* Dynamic Arrays */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Responsibilities</h3>
            {formData.responsibilities.map((resp, index) => (
              <div key={index} className="flex space-x-2">
                <input
                  type="text"
                  value={resp}
                  onChange={(e) => handleArrayChange('responsibilities', index, e.target.value)}
                  className="input-field flex-1"
                  placeholder="Lead development of new features"
                />
                <button
                  type="button"
                  onClick={() => removeArrayField('responsibilities', index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Minus className="h-5 w-5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayField('responsibilities')}
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Add Responsibility</span>
            </button>
          </div>

          {/* Skills */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Required Skills *</h3>
              {formData.requiredSkills.map((skill, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) => handleArrayChange('requiredSkills', index, e.target.value)}
                    className="input-field flex-1"
                    placeholder="React, Node.js, MongoDB"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayField('requiredSkills', index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayField('requiredSkills')}
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">Add Skill</span>
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Preferred Skills</h3>
              {formData.preferredSkills.map((skill, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) => handleArrayChange('preferredSkills', index, e.target.value)}
                    className="input-field flex-1"
                    placeholder="AWS, Docker, TypeScript"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayField('preferredSkills', index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayField('preferredSkills')}
                className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">Add Skill</span>
              </button>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                name="location.city"
                value={formData.location.city}
                onChange={handleChange}
                className="input-field"
                placeholder="City"
              />
              <input
                type="text"
                name="location.state"
                value={formData.location.state}
                onChange={handleChange}
                className="input-field"
                placeholder="State"
              />
              <input
                type="text"
                name="location.country"
                value={formData.location.country}
                onChange={handleChange}
                required
                className="input-field"
                placeholder="Country *"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="location.isRemote"
                checked={formData.location.isRemote}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="text-sm text-gray-700">Remote position</label>
            </div>
          </div>

          {/* Experience & Education */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Level *
              </label>
              <select name="experienceLevel" value={formData.experienceLevel} onChange={handleChange} className="input-field">
                <option value="Entry">Entry Level</option>
                <option value="Mid">Mid Level</option>
                <option value="Senior">Senior Level</option>
                <option value="Lead">Lead</option>
                <option value="Executive">Executive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Education *
              </label>
              <select name="education" value={formData.education} onChange={handleChange} className="input-field">
                <option value="High School">High School</option>
                <option value="Associate">Associate</option>
                <option value="Bachelor">Bachelor</option>
                <option value="Master">Master</option>
                <option value="PhD">PhD</option>
                <option value="Any">Any</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Experience Years</label>
              <div className="flex space-x-2 items-center">
                <input
                  type="number"
                  name="experienceYears.min"
                  value={formData.experienceYears.min}
                  onChange={handleChange}
                  min="0"
                  className="input-field"
                  placeholder="Min"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="number"
                  name="experienceYears.max"
                  value={formData.experienceYears.max}
                  onChange={handleChange}
                  min="0"
                  className="input-field"
                  placeholder="Max"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Deadline *
              </label>
              <input
                type="date"
                name="applicationDeadline"
                value={formData.applicationDeadline}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="input-field"
              />
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Benefits (Optional)</h3>
            {formData.benefits.map((benefit, index) => (
              <div key={index} className="flex space-x-2">
                <input
                  type="text"
                  value={benefit}
                  onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                  className="input-field flex-1"
                  placeholder="Health insurance, 401k, Remote work"
                />
                <button
                  type="button"
                  onClick={() => removeArrayField('benefits', index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Minus className="h-5 w-5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayField('benefits')}
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Add Benefit</span>
            </button>
          </div>

          {/* Additional Details */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Vacancies *
              </label>
              <input
                type="number"
                name="vacancies"
                value={formData.vacancies}
                onChange={handleChange}
                required
                min="1"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email (Optional)
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                className="input-field"
                placeholder="careers@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select name="status" value={formData.status} onChange={handleChange} className="input-field">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : editJob ? 'Update Job' : 'Create Job'}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJobForm;