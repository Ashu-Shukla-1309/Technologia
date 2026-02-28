import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer'); // 🚀 NEW: Role state
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      // 🚀 NEW: Send role in the request body
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, { email, password, role });
      alert("Verification code sent to your email!");
      navigate('/verify', { state: { email } });
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed.");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <form onSubmit={handleSignup} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
        <h2 className="text-3xl font-black mb-6 text-center">Create Account</h2>
        
        {/* 🚀 NEW: Role Selection UI */}
        <div className="flex justify-center gap-6 mb-6">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
            <input 
              type="radio" name="role" value="customer" 
              checked={role === 'customer'} 
              onChange={() => setRole('customer')} 
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            Customer
          </label>
          <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-700">
            <input 
              type="radio" name="role" value="seller" 
              checked={role === 'seller'} 
              onChange={() => setRole('seller')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500" 
            />
            Seller
          </label>
        </div>

        <div className="space-y-4">
          <input 
            type="email" placeholder="Email Address" 
            className="w-full p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" 
            onChange={e => setEmail(e.target.value)} required 
          />
          <input 
            type="password" placeholder="Create Password" 
            className="w-full p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" 
            onChange={e => setPassword(e.target.value)} required 
          />
          <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition">
            Sign Up
          </button>
        </div>
        <p className="mt-6 text-center text-gray-500">
          Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:underline">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Signup;