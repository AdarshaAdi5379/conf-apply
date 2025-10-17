import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [role,setRole]=useState('candidate');
  const handleSubmit=async(e)=>{ e.preventDefault(); try{ await register(name,email,password,role); window.location.href='/dashboard'; }catch(err){ alert(err.response?.data?.error || 'Registration failed'); } };
  return (
    <div className="max-w-md mx-auto py-12">
      <div className="card">
        <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="input-field" placeholder="Full name" value={name} onChange={(e)=>setName(e.target.value)} />
          <input className="input-field" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input type="password" className="input-field" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          <select className="input-field" value={role} onChange={(e)=>setRole(e.target.value)}>
            <option value="candidate">Candidate</option>
            <option value="recruiter">Recruiter</option>
          </select>
          <button className="btn-primary w-full">Register</button>
        </form>
      </div>
    </div>
  );
};

export default Register;