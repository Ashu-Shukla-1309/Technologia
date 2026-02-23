import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import OrderTrackerModal from '../components/OrderTrackerModal';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/orders`)
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
      setOrders(orders.filter(order => order._id !== id));
      // Return true to let the modal know the API call succeeded 
      // so it can show the CancelAnim before closing.
      return true; 
    } catch (err) {
      alert("Failed to cancel.");
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-[#050b14] text-white py-12 px-4 md:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl font-black mb-2 text-white uppercase tracking-tighter">Your Orders</h2>
        <p className="text-gray-400 mb-10">Track, manage, or return your gear.</p>
        
        {orders.length === 0 ? (
          <div className="bg-[#111827] border border-gray-800 p-16 rounded-3xl text-center">
            <h3 className="text-2xl font-bold text-gray-500 mb-4">No active orders</h3>
            <p className="text-gray-600">Looks like you haven't shopped yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
                key={order._id} 
                className="bg-[#1e293b]/60 border border-gray-700 p-6 rounded-3xl hover:border-blue-500/50 transition-all group flex flex-col md:flex-row justify-between items-center gap-6"
              >
                <div className="flex-1 w-full md:w-auto">
                  <div className="flex justify-between md:justify-start items-center gap-4 mb-4">
                    <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-500/20">
                      Processing
                    </span>
                    <span className="text-gray-500 text-sm font-mono">#{order._id.slice(-6)}</span>
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="flex -space-x-3">
                        {order.items.slice(0, 3).map((item, i) => (
                            <div key={i} className="w-12 h-12 bg-white rounded-lg border-2 border-[#1e293b] overflow-hidden p-1">
                                <img src={item.image} className="w-full h-full object-contain" alt={item.name} />
                            </div>
                        ))}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-white">
                            {order.items.length} Item{order.items.length > 1 && 's'}
                        </h3>
                        <p className="text-gray-400 text-sm">Ordered on {new Date(order.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-bold uppercase">Total</p>
                    <p className="text-2xl font-black text-white">₹{order.total}</p>
                  </div>

                  <button 
                    onClick={() => handleOpenTracker(order)}
                    className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-blue-500 hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
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
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
        onCancelOrder={handleCancelOrder}
      />
    </div>
  );
};

export default Orders;