import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const LoginTemp = ({ setToken, setIsAdmin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, { email, password });
      
      // SAVE EVERYTHING TO STORAGE
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('isAdmin', res.data.isAdmin);
      localStorage.setItem('userEmail', res.data.email); // <--- CRITICAL UPDATE
      
      setToken(res.data.token);
      setIsAdmin(res.data.isAdmin);
      
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || "Login Failed");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
        <h2 className="text-3xl font-black mb-6 text-center text-gray-800">Login</h2>
        <div className="space-y-4">
          <input 
            type="email" placeholder="Email Address" 
            className="w-full p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" 
            onChange={e => setEmail(e.target.value)} required 
          />
          <div>
            <input 
              type="password" placeholder="Password" 
              className="w-full p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" 
              onChange={e => setPassword(e.target.value)} required 
            />
            <div className="text-right mt-2">
              <Link to="/forgot-password" class="text-sm text-blue-500 font-bold hover:underline">Forgot Password?</Link>
            </div>
          </div>
          <button className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition">
            Login
          </button>
        </div>
        <p className="mt-6 text-center text-gray-500">
          New here? <Link to="/signup" className="text-blue-600 font-bold hover:underline">Create Account</Link>
        </p>
      </form>
    </div>
  );
};

export default LoginTemp;