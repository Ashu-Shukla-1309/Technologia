import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cooldown > 0) return;
    
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, { email });
      setCooldown(60); 
      alert("Reset code sent to your email!");
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      alert(err.response?.data?.error || "Something went wrong!");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center border border-gray-100">
        <h2 className="text-2xl font-black mb-4">Reset Password</h2>
        <p className="text-gray-500 mb-6">Enter your email to receive a code.</p>
        <input 
          type="email" 
          placeholder="Enter your email" 
          className="w-full p-4 bg-gray-50 rounded-xl mb-6 outline-none border focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          onChange={e => setEmail(e.target.value)} 
          required 
        />
        <button 
          type="submit" 
          disabled={cooldown > 0}
          className={`w-full py-4 rounded-xl font-black text-lg text-white transition-all ${
            cooldown > 0 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30'
          }`}
        >
          {cooldown > 0 ? `Please wait ${cooldown}s` : 'Send Code'}
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;