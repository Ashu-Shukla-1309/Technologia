import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const ResetPassword = () => {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [cooldown, setCooldown] = useState(60);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) navigate('/forgot-password');
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleChange = (element, index) => {
    const value = element.value;
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const finalOtp = otp.join("");
    if (finalOtp.length < 6) return alert("Please enter the full 6-digit code");

    try {
      await axios.post('http://localhost:5000/api/auth/reset-password', { 
        email, otp: finalOtp, newPassword 
      });
      alert("Password Reset Successful! Please Login.");
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.error || "Invalid Code");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-xl w-full max-w-md text-center">
        <h2 className="text-3xl font-black mb-2">New Password</h2>
        <p className="text-gray-500 mb-8">Enter code sent to <br/><b>{email}</b></p>
        
        <form onSubmit={handleVerify}>
          <div className="flex justify-center gap-2 mb-6">
            {otp.map((data, index) => (
              <input
                key={index} 
                type="text" 
                ref={el => inputRefs.current[index] = el}
                value={data}
                onChange={e => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onFocus={(e) => e.target.select()}
                className="w-10 h-14 md:w-12 md:h-16 text-2xl font-black text-center bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none focus:ring-4 focus:ring-blue-100 transition-all"
              />
            ))}
          </div>
          <input 
            type="password" 
            placeholder="Enter New Password"
            className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl mb-6 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
            onChange={e => setNewPassword(e.target.value)} 
            required
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
            Update Password
          </button>
        </form>

        <p className="mt-8 text-sm text-gray-400">
          Didn't receive the code? 
          <button 
            type="button"
            onClick={() => setCooldown(60)}
            disabled={cooldown > 0}
            className={`ml-1 font-bold transition-all ${cooldown > 0 ? 'text-gray-300 cursor-not-allowed' : 'text-blue-600 hover:underline'}`}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;