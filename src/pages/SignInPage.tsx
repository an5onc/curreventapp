import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api';

const SignInPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Login failed');
      }

      const data = await res.json();

      const user = {
        id: data.accountID.toString(),
        email: data.email,
        role: data.role,
      };  

      login(user);
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#ffffff] via-[#9eb9d5] to-[#CBD6E0]/10 pt-16 pb-12">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-6">
        {/* Heading */}
        <h2 className="text-2xl font-semibold mb-4 text-center text-[#001F3D]">
          Sign In
        </h2>

        {/* Error */}
        {error && (
          <div className="text-red-700 bg-red-100 border border-red-300 px-3 py-2 rounded-md mb-4">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-[#1C1C1C]">Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001F3D] focus:border-[#001F3D]"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-[#1C1C1C]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-[#001F3D] focus:border-[#001F3D]"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-[#001F3D] text-white rounded-md font-semibold hover:bg-[#003366] focus:outline-none focus:ring-2 focus:ring-[#001F3D] focus:ring-offset-1"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignInPage;
