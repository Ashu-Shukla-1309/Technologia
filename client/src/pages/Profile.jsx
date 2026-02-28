import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Profile = ({ logout }) => {
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState({ name: '', phone: '', address: '', email: '', role: 'customer', isVerifiedSeller: false });
  const [isEditing, setIsEditing] = useState(false);
  const email = localStorage.getItem('userEmail');
  const token = localStorage.getItem('token');

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchProfileData = async () => {
      try {
        const authConfig = { headers: { Authorization: `Bearer ${token}` } };
        const [ordersRes, profileRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/orders`, authConfig),
          axios.get(`${import.meta.env.VITE_API_URL}/api/users/me`, authConfig)
        ]);
        setOrders(ordersRes.data);
        if (profileRes.data) setProfile(profileRes.data);
      } catch (err) { console.error("Failed to load profile data", err); }
    };
    fetchProfileData();
  }, [token]);

  const handleSaveProfile = async () => {
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    
    if (!profile.name?.trim()) return toast.error("Full Name is required.");
    if (!phoneRegex.test(profile.phone)) return toast.error("Please enter a valid phone number.");
    if (!profile.address?.trim()) return toast.error("Complete Address is required."); // 👈 NEW Validation

    try {
      const authConfig = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/users/me`, {
        name: profile.name,
        phone: profile.phone,
        address: profile.address // 👈 NEW: Send address to backend
      }, authConfig);
      
      setProfile(res.data);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) { toast.error("Failed to update profile."); }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* 🚀 UPDATED WARNING: Checks for Address too */}
        {profile.role === 'seller' && (!profile.name || !profile.phone || !profile.address) && (
          <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-800 p-4 mb-8 rounded-r-xl shadow-sm flex items-center gap-4">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold">Action Required to Sell!</p>
              <p className="text-sm">You must click "Edit Profile" below and provide your Name, Phone Number, and Complete Address before you can add products to the inventory.</p>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight">Your Hub</h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-blue-600 font-mono font-bold">{profile.email || email}</p>
              {profile.role === 'seller' && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${profile.isVerifiedSeller ? 'bg-green-100 text-green-700 border-green-300' : 'bg-yellow-100 text-yellow-700 border-yellow-300'}`}>
                  {profile.isVerifiedSeller ? '✅ Verified Seller' : '⏳ Pending Verification'}
                </span>
              )}
            </div>
          </div>
          <button onClick={logout} className="border border-red-500 text-red-600 px-6 py-2 rounded-xl hover:bg-red-50 hover:text-red-700 font-bold transition">Logout</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm md:col-span-2 relative">
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-500 uppercase text-sm font-black tracking-widest">Personal Details</p>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="text-blue-600 text-sm font-bold hover:underline">Edit Profile</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setIsEditing(false)} className="text-gray-500 text-sm font-bold hover:underline">Cancel</button>
                  <button onClick={handleSaveProfile} className="bg-blue-600 text-white px-4 py-1 rounded-lg text-sm font-bold hover:bg-blue-700 transition">Save</button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs text-gray-400 font-bold uppercase mb-1">Full Name</label>
                {isEditing ? (
                  <input type="text" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} className="w-full bg-gray-50 border p-2 rounded-lg outline-none focus:border-blue-500" placeholder="John Doe" />
                ) : (
                  <p className={`text-lg font-bold ${profile.name ? 'text-gray-900' : 'text-gray-400 italic'}`}>{profile.name || "Not provided"}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-400 font-bold uppercase mb-1">Phone Number</label>
                {isEditing ? (
                  <input type="tel" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} className="w-full bg-gray-50 border p-2 rounded-lg outline-none focus:border-blue-500" placeholder="e.g. 9876543210" />
                ) : (
                  <p className={`text-lg font-bold ${profile.phone ? 'text-gray-900' : 'text-gray-400 italic'}`}>{profile.phone || "Not provided"}</p>
                )}
              </div>
            </div>
            
            {/* 🚀 NEW: Address Field Block */}
            <div className="border-t border-gray-100 pt-6">
              <label className="block text-xs text-gray-400 font-bold uppercase mb-1">Complete Business/Home Address</label>
              {isEditing ? (
                <textarea 
                  value={profile.address} 
                  onChange={(e) => setProfile({...profile, address: e.target.value})} 
                  className="w-full bg-gray-50 border p-3 rounded-xl outline-none focus:border-blue-500 resize-none h-24" 
                  placeholder="Street, City, State, ZIP..." 
                />
              ) : (
                <p className={`text-lg font-bold ${profile.address ? 'text-gray-900' : 'text-gray-400 italic'}`}>{profile.address || "Not provided"}</p>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-center items-start">
            <p className="text-gray-500 uppercase text-xs font-bold tracking-widest">Total Orders</p>
            <p className="text-5xl font-black text-blue-600 mt-2">{orders.length}</p>
          </div>
        </div>

        <h2 className="text-2xl font-black mb-6 text-gray-900 tracking-tight">Past Acquisitions</h2>
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order._id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:justify-between md:items-center gap-4 hover:shadow-md transition">
              <div>
                <p className="text-blue-600 font-black text-lg">#{order._id.slice(-6).toUpperCase()}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {order.status}
                  </span>
                  <p className="text-gray-500 text-sm font-medium">{new Date(order.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-sm text-gray-500 font-bold">Total Paid</p>
                <p className="text-3xl font-black text-gray-900">₹{order.total.toLocaleString('en-IN')}</p>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
             <p className="text-gray-500 font-medium italic bg-white p-6 rounded-2xl border border-gray-200 text-center">You haven't placed any orders yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;