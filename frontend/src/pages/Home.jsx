import React from 'react';
import Hero from '../components/Hero';

const Home = () => {
  return (
    <div>
      <Hero />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">How it works</h3>
            <p className="text-gray-600">Verify recruiters using multi-source signals and community feedback.</p>
          </div>
          <div className="card">
            <h3 className="text-xl font-semibold mb-2">Community</h3>
            <p className="text-gray-600">Report suspicious recruiters and help others hire safely.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;