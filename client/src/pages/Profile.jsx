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
    <div className="min-h-screen bg-gray-50 text-gray-900 p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-5xl font-black uppercase">Your Hub</h1>
            <p className="text-blue-600 font-mono mt-2 font-bold">{email}</p>
          </div>
          <button onClick={logout} className="border border-red-500 text-red-600 px-6 py-2 rounded-xl hover:bg-red-50 hover:text-red-700 font-bold transition">Logout</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
            <p className="text-gray-500 uppercase text-xs font-bold">Total Orders</p>
            <p className="text-4xl font-black text-gray-900 mt-2">{orders.length}</p>
          </div>
        </div>

        <h2 className="text-2xl font-black mb-6 text-gray-900">Past Acquisitions</h2>
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order._id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex justify-between items-center hover:shadow-md transition">
              <div>
                <p className="text-blue-600 font-bold">#{order._id.slice(-6)}</p>
                <p className="text-gray-500 text-sm">{new Date(order.date).toLocaleDateString()}</p>
              </div>
              <p className="text-2xl font-black text-gray-900">₹{order.total}</p>
            </div>
          ))}
          {orders.length === 0 && (
             <p className="text-gray-500 italic">You haven't placed any orders yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;