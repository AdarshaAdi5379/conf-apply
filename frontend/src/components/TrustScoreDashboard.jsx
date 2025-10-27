import { CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { getTrustLevel } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';

const TrustScoreDashboard = ({ data }) => {
  const navigate = useNavigate();
  const trustLevel = getTrustLevel(data.trustScore);
  const { verificationDetails } = data;

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Main Trust Score */}
      <div className="card bg-gradient-to-br from-primary-50 to-blue-50">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Trust Score</h3>
          <div className={`text-6xl font-bold ${getScoreColor(data.trustScore)} mb-2`}>
            {data.trustScore}
          </div>
          <div className={`inline-block px-4 py-2 rounded-full ${trustLevel.bgColor} ${trustLevel.textColor} font-medium`}>
            {trustLevel.label}
          </div>
          
          {data.recruiterId && (
            <button
              onClick={() => navigate(`/recruiter/${data.recruiterId}`)}
              className="mt-6 btn-primary flex items-center justify-center space-x-2 mx-auto"
            >
              <span>View Full Profile</span>
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Breakdown</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Domain Score</span>
            <span className={`font-semibold ${getScoreColor(data.domainScore)}`}>
              {data.domainScore}/100
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${data.domainScore >= 70 ? 'bg-green-500' : data.domainScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${data.domainScore}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-gray-700">LinkedIn Verified</span>
            {data.verifiedLinkedIn ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
          </div>
        </div>
      </div>

      {/* Verification Details */}
      {verificationDetails && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Email Verification */}
          <div className="card">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              {verificationDetails.emailVerification.verified ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span>Email Verification</span>
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-medium capitalize">{verificationDetails.emailVerification.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Score</span>
                <span className={`font-medium ${getScoreColor(verificationDetails.emailVerification.score)}`}>
                  {verificationDetails.emailVerification.score}/100
                </span>
              </div>
              {verificationDetails.emailVerification.isDisposable && (
                <div className="flex items-center space-x-2 text-red-600 mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs">Disposable email detected</span>
                </div>
              )}
            </div>
          </div>

          {/* Domain Verification */}
          <div className="card">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              {verificationDetails.domainVerification.verified ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span>Domain Verification</span>
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Score</span>
                <span className={`font-medium ${getScoreColor(verificationDetails.domainVerification.score)}`}>
                  {verificationDetails.domainVerification.score}/100
                </span>
              </div>
              {verificationDetails.domainVerification.companyData && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-gray-700 font-medium">
                    {verificationDetails.domainVerification.companyData.name}
                  </p>
                  {verificationDetails.domainVerification.companyData.description && (
                    <p className="text-gray-600 text-xs mt-1">
                      {verificationDetails.domainVerification.companyData.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* URL Safety */}
      {verificationDetails?.urlSafety && (
        <div className="card">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            {verificationDetails.urlSafety.safe ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            <span>URL Safety Check</span>
          </h4>
          <p className="text-sm text-gray-600">
            {verificationDetails.urlSafety.safe
              ? 'No security threats detected'
              : 'Warning: Potential security threat detected'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TrustScoreDashboard;