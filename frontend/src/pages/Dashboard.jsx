import React from 'react';

const Dashboard = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">Leaderboard and stats</div>
        <div className="card">Recent activity</div>
        <div className="card">Manage feedback</div>
      </div>
    </div>
  );
};

export default Dashboard;