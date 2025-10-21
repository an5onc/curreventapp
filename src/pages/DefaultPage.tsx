import React from 'react';
import { Link } from 'react-router-dom';
import bearLogo from '../assets/images/bearlogo.png';

const DefaultPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#ffffff] via-[#9eb9d5] to-[#CBD6E0]/10 pt-16 pb-12 ">
      <img src={bearLogo} alt="Bear logo" className="h-24 w-24 mb-6" />
      
      {/* Heading */}
      <h1 className="text-3xl font-bold text-[#001F3D] mb-2">
        Welcome to the Bear Browser
      </h1>

      {/* Subtext */}
      <p className="text-[#333333] mb-6 text-center">
        Sign in or create an account to view events.
      </p>

      {/* Buttons */}
      <div className="flex gap-4">
        <Link
          to="/login"
          className="px-4 py-2 bg-[#001F3D] text-white rounded hover:bg-[#003366] font-semibold"
        >
          Sign In
        </Link>
        <Link
          to="/manage"
          className="px-4 py-2 bg-[#FFD700] text-black rounded hover:bg-[#FFCC00] font-semibold"
        >
          Create Account
        </Link>
      </div>
    </div>
  );
};

export default DefaultPage;
