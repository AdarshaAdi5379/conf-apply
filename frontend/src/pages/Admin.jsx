import React from 'react';

const Admin = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">Flagged recruiters</div>
        <div className="card">Reported feedback</div>
      </div>
    </div>
  );
};

export default Admin;