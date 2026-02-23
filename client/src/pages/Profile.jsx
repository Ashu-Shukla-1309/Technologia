import { useEffect, useState } from 'react';
import axios from 'axios';

const Profile = ({ logout }) => {
  const [orders, setOrders] = useState([]);
  const email = localStorage.getItem('userEmail');

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/orders?email=${email}`)
      .then(res => setOrders(res.data));
  }, [email]);

  return (
    <div className="min-h-screen bg-[#050b14] text-white p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-black uppercase">Your Hub</h1>
            <p className="text-blue-400 font-mono mt-2">{email}</p>
          </div>
          <button onClick={logout} className="border border-red-500 text-red-500 px-6 py-2 rounded-xl hover:bg-red-500 hover:text-white transition">Logout</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
            <p className="text-gray-500 uppercase text-xs font-bold">Total Orders</p>
            <p className="text-4xl font-black">{orders.length}</p>
          </div>
        </div>

        <h2 className="text-2xl font-black mb-6">Past Acquisitions</h2>
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order._id} className="bg-white/5 p-6 rounded-2xl border border-white/10 flex justify-between">
              <div>
                <p className="text-blue-400 font-bold">#{order._id.slice(-6)}</p>
                <p className="text-gray-500 text-sm">{new Date(order.date).toLocaleDateString()}</p>
              </div>
              <p className="text-2xl font-black">₹{order.total}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;