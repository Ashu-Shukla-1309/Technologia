import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const VerifyOTP = () => {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [cooldown, setCooldown] = useState(60);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) navigate('/signup');
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
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, { email, otp: finalOtp });
      alert("Technologia: Account Verified Successfully!");
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.error || "Invalid Code");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-gray-100 text-center">
        <div className="mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📧</span>
          </div>
          <h2 className="text-3xl font-black text-gray-800">Check Your Inbox</h2>
          <p className="text-gray-500 mt-2">
            We sent a 6-digit code to <br/>
            <span className="font-bold text-blue-600">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerify}>
          <div className="flex justify-center gap-2 md:gap-3 mb-10">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                ref={(el) => (inputRefs.current[index] = el)}
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onFocus={(e) => e.target.select()}
                className="w-12 h-16 md:w-14 md:h-20 text-3xl font-black text-center bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              />
            ))}
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-blue-700 hover:shadow-xl transition-all active:scale-95 shadow-lg shadow-blue-200">
            Verify & Create Account
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

export default VerifyOTP;