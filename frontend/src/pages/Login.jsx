import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };
  return (
    <div className="max-w-md mx-auto py-12">
      <div className="card">
        <h2 className="text-2xl font-semibold mb-4">Login</h2>
        {error && <div className="text-red-600 mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="input-field" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input type="password" className="input-field" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          <button className="btn-primary w-full">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;