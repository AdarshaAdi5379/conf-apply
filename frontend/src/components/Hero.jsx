import { Shield, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <div className="bg-gradient-to-br from-primary-50 to-blue-100 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
            Recruit Smarter. <span className="text-primary-600">Stay Safe.</span>
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Verify recruiter authenticity, detect fake job listings, and make informed decisions with our AI-powered trust analytics platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Link to="/register" className="btn-primary text-lg px-8 py-3">
              Start Verification
            </Link>
            <Link to="/dashboard" className="btn-secondary text-lg px-8 py-3">
              View Leaderboard
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-16">
            <div className="card text-center hover:shadow-md transition-shadow">
              <Shield className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Verify Recruiters</h3>
              <p className="text-gray-600 text-sm">Real-time verification using multiple data sources</p>
            </div>
            
            <div className="card text-center hover:shadow-md transition-shadow">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Trust Scores</h3>
              <p className="text-gray-600 text-sm">AI-powered scoring from 0-100 for transparency</p>
            </div>
            
            <div className="card text-center hover:shadow-md transition-shadow">
              <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Report Fakes</h3>
              <p className="text-gray-600 text-sm">Help the community by reporting suspicious recruiters</p>
            </div>
            
            <div className="card text-center hover:shadow-md transition-shadow">
              <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Track Analytics</h3>
              <p className="text-gray-600 text-sm">Monitor recruiter reputation over time</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;