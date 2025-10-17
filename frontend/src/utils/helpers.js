export const getTrustLevel = (score) => {
  if (score >= 70) {
    return { level: 'high', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800', label: 'Highly Trusted' };
  }
  if (score >= 40) {
    return { level: 'medium', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', label: 'Moderately Trusted' };
  }
  return { level: 'low', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800', label: 'Low Trust' };
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatRelativeTime = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffInMs = now - past;
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
};

export const isValidEmail = (email) => {
  return /^\S+@\S+\.\S+$/.test(email);
};

export const getStarArray = (rating) => {
  return Array.from({ length: 5 }, (_, i) => i < rating);
};

export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};