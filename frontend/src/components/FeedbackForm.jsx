import { useState } from 'react';
import { feedbackAPI } from '../services/api';
import { Star, Send, Flag } from 'lucide-react';

const FeedbackForm = ({ recruiterId, onSuccess }) => {
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
    tags: [],
    isReported: false,
    reportReason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const availableTags = [
    'responsive', 'professional', 'ghosted', 'fake', 
    'helpful', 'slow', 'transparent', 'misleading'
  ];

  const reportReasons = [
    { value: 'fake_recruiter', label: 'Fake Recruiter' },
    { value: 'ghosting', label: 'Ghosting' },
    { value: 'misleading_job', label: 'Misleading Job Description' },
    { value: 'scam', label: 'Scam' },
    { value: 'unprofessional', label: 'Unprofessional Behavior' },
    { value: 'other', label: 'Other' }
  ];

  const handleRating = (rating) => {
    setFormData({ ...formData, rating });
  };

  const handleTagToggle = (tag) => {
    const newTags = formData.tags.includes(tag)
      ? formData.tags.filter(t => t !== tag)
      : [...formData.tags, tag];
    setFormData({ ...formData, tags: newTags });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.rating === 0) {
      setError('Please select a rating');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        recruiterId,
        rating: formData.rating,
        comment: formData.comment,
        tags: formData.tags
      };

      if (formData.isReported && formData.reportReason) {
        payload.reportReason = formData.reportReason;
      }

      await feedbackAPI.create(payload);
      
      // Reset form
      setFormData({
        rating: 0,
        comment: '',
        tags: [],
        isReported: false,
        reportReason: ''
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Submit Feedback</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Your Rating *
          </label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoveredRating || formData.rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
            <span className="ml-4 text-gray-600 font-medium">
              {formData.rating > 0 && `${formData.rating} / 5`}
            </span>
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Experience * (minimum 10 characters)
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            required
            minLength={10}
            maxLength={1000}
            rows={4}
            className="input-field resize-none"
            placeholder="Share your experience with this recruiter..."
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.comment.length} / 1000 characters
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tags (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  formData.tags.includes(tag)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Report Option */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center space-x-3 mb-4">
            <input
              type="checkbox"
              id="report"
              checked={formData.isReported}
              onChange={(e) => setFormData({ ...formData, isReported: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="report" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Flag className="h-4 w-4 text-red-600" />
              <span>Report this recruiter</span>
            </label>
          </div>

          {formData.isReported && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Report
              </label>
              <select
                value={formData.reportReason}
                onChange={(e) => setFormData({ ...formData, reportReason: e.target.value })}
                className="input-field"
              >
                <option value="">Select a reason</option>
                {reportReasons.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center space-x-2"
        >
          <Send className="h-5 w-5" />
          <span>{loading ? 'Submitting...' : 'Submit Feedback'}</span>
        </button>
      </form>
    </div>
  );
};

export default FeedbackForm;