import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import OrderTrackerModal from '../components/OrderTrackerModal';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail');
    axios.get(`${import.meta.env.VITE_API_URL}/api/orders?email=${userEmail}`)
      .then(res => setOrders(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleOpenTracker = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCancelOrder = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/orders/${id}`);
      return true; 
    } catch (err) {
      alert("Failed to cancel.");
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-12 px-4 md:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl font-black mb-2 text-gray-900 uppercase tracking-tighter">Your Orders</h2>
        <p className="text-gray-500 mb-10">Track, manage, or return your gear.</p>
        
        {orders.length === 0 ? (
          <div className="bg-white border border-gray-200 p-16 rounded-3xl text-center shadow-sm">
            <h3 className="text-2xl font-bold text-gray-400 mb-4">No active orders</h3>
            <p className="text-gray-500">Looks like you haven't shopped yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
                key={order._id} 
                className="bg-white border border-gray-200 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group flex flex-col md:flex-row justify-between items-center gap-6"
              >
                <div className="flex-1 w-full md:w-auto">
                  <div className="flex justify-between md:justify-start items-center gap-4 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                      {order.status || 'Processing'}
                    </span>
                    <span className="text-gray-400 text-sm font-mono">#{order._id.slice(-6)}</span>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="flex -space-x-3">
                        {order.items.slice(0, 3).map((item, i) => (
                            <div key={i} className="w-12 h-12 bg-gray-50 rounded-lg border-2 border-white shadow-sm overflow-hidden p-1">
                                <img src={item.image} className="w-full h-full object-contain mix-blend-multiply" alt={item.name} />
                            </div>
                        ))}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">
                            {order.items.length} Item{order.items.length > 1 && 's'}
                        </h3>
                        <p className="text-gray-500 text-sm">Ordered on {new Date(order.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-bold uppercase">Total</p>
                    <p className="text-2xl font-black text-gray-900">₹{order.total}</p>
                  </div>

                  <button 
                    onClick={() => handleOpenTracker(order)}
                    className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 hover:text-white transition-all shadow-md group-hover:shadow-lg"
                  >
                    Track Order
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <OrderTrackerModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          const userEmail = localStorage.getItem('userEmail');
          axios.get(`${import.meta.env.VITE_API_URL}/api/orders?email=${userEmail}`)
            .then(res => setOrders(res.data))
            .catch(err => console.error(err));
        }}
        order={selectedOrder}
        onCancelOrder={handleCancelOrder}
        isAdmin={localStorage.getItem('isAdmin') === 'true'}
        userEmail={localStorage.getItem('userEmail')}
      />
    </div>
  );
};

export default Orders;