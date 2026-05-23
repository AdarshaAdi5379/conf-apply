import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../services/api';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    phone: '',
    summary: '',
    location: '',
    portfolioUrl: '',
    linkedInUrl: '',
    githubUrl: '',
    skills: [],
    education: [],
    experience: [],
    availability: '',
    preferredRoles: [],
    expectedSalary: { min: 0, max: 0, currency: 'USD' }
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await profileAPI.getProfile();
      if (res.data.success && res.data.data) {
        setProfile(res.data.data);
        setFormData({
          ...formData,
          ...res.data.data
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSkillsChange = (e) => {
    const skills = e.target.value.split(',').map(s => s.trim());
    setFormData(prev => ({ ...prev, skills }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await profileAPI.updateProfile(formData);
      if (res.data.success) {
        setProfile(res.data.data);
        setEditing(false);
        setSuccess('Profile updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setSuccess('');
    const data = new FormData();
    data.append('resume', file);

    try {
      const res = await profileAPI.uploadResume(data);
      if (res.data.success) {
        setProfile(res.data.data);
        setSuccess('Resume uploaded successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to upload resume');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg my-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
        <button
          onClick={() => {
            setEditing(!editing);
            setError('');
            setSuccess('');
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          {editing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Summary / Bio</label>
            <textarea
              name="summary"
              rows={4}
              value={formData.summary}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Portfolio URL</label>
              <input
                type="url"
                name="portfolioUrl"
                value={formData.portfolioUrl}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
              <input
                type="url"
                name="linkedInUrl"
                value={formData.linkedInUrl}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">GitHub URL</label>
              <input
                type="url"
                name="githubUrl"
                value={formData.githubUrl}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Skills (comma separated)</label>
            <input
              type="text"
              name="skills"
              value={formData.skills.join(', ')}
              onChange={handleSkillsChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-8">
          <section className="border-b pb-6">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 bg-gray-200 rounded-full flex items-center justify-center text-3xl font-bold text-gray-500">
                {user?.name?.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">{user?.name}</h2>
                <p className="text-gray-600">{user?.email}</p>
                <p className="text-gray-500 mt-1">{profile?.location || 'Location not set'}</p>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-700">Summary</h3>
              <p className="text-gray-600 mt-2 whitespace-pre-wrap">
                {profile?.summary || 'No summary provided yet.'}
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b pb-8">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Contact & Links</h3>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-600">
                  <span className="font-semibold w-24">Phone:</span> {profile?.phone || 'N/A'}
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="font-semibold w-24">Portfolio:</span>
                  {profile?.portfolioUrl ? (
                    <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Portfolio</a>
                  ) : 'N/A'}
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="font-semibold w-24">LinkedIn:</span>
                  {profile?.linkedInUrl ? (
                    <a href={profile.linkedInUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Profile</a>
                  ) : 'N/A'}
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="font-semibold w-24">GitHub:</span>
                  {profile?.githubUrl ? (
                    <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">GitHub</a>
                  ) : 'N/A'}
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Resume</h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
                {profile?.resumeName ? (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 truncate">{profile.resumeName}</span>
                    <label className="text-blue-600 hover:text-blue-800 cursor-pointer text-sm font-medium">
                      Change
                      <input type="file" className="hidden" onChange={handleResumeUpload} accept=".pdf,.doc,.docx" />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer">
                    <span className="text-gray-500 text-sm">No resume uploaded</span>
                    <span className="text-blue-600 font-medium text-sm mt-1">Upload Resume</span>
                    <input type="file" className="hidden" onChange={handleResumeUpload} accept=".pdf,.doc,.docx" />
                  </label>
                )}
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-medium text-gray-700 mb-4">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {profile?.skills?.length > 0 ? (
                profile.skills.map((skill, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 italic">No skills added yet.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Profile;
