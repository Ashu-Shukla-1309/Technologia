import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import CancelAnim from './CancelAnim';

const OrderTrackerModal = ({ isOpen, onClose, order, onCancelOrder, isAdmin, userEmail }) => {
  const [view, setView] = useState('tracking');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setView('tracking');
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const currentStatus = order?.status || 'Processing';
  const statusLevels = ["Processing", "Shipped", "Out for Delivery", "Delivered"];
  const currentIndex = statusLevels.indexOf(currentStatus);

  const trackingSteps = [
    { title: "Order Placed", date: new Date(order.date).toLocaleDateString(), completed: true },
    { title: "Processing", date: currentIndex >= 0 ? "Completed" : "Pending", completed: currentIndex >= 0 },
    { title: "Shipped", date: currentIndex >= 1 ? "Completed" : "Pending", completed: currentIndex >= 1 },
    { title: "Out for Delivery", date: currentIndex >= 2 ? "Completed" : "Pending", completed: currentIndex >= 2 },
    { title: "Delivered", date: currentIndex >= 3 ? "Completed" : "Pending", completed: currentIndex >= 3 },
  ];

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setIsLoading(true);
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/orders/${order._id}/status`, {
        status: newStatus,
        adminEmail: userEmail
      });
      onClose(); 
    } catch (err) {
      alert("Failed to update status");
    }
    setIsLoading(false);
  };

  const executeCancellation = async (e) => {
    e.preventDefault(); 
    setIsLoading(true);
    const success = await onCancelOrder(order._id);
    if (success) {
      setView('cancelled'); 
    }
    setIsLoading(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        />

        <motion.div 
          className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} layout
        >
          {view !== 'cancelled' && (
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <div>
                 <h2 className="text-xl font-black text-gray-900 uppercase tracking-wider">
                   {view === 'tracking' ? 'Track Order' : 'Cancel Order'}
                 </h2>
                 <p className="text-xs text-blue-600 font-mono">ID: {order._id}</p>
               </div>
               <button type="button" disabled={isLoading} onClick={onClose} className="text-gray-400 hover:text-gray-900 text-xl disabled:opacity-50">✕</button>
            </div>
          )}

          <div className={`${view === 'cancelled' ? '' : 'p-6 overflow-y-auto custom-scrollbar'}`}>
            <AnimatePresence mode="wait">
              {view === 'tracking' && (
                <motion.div 
                  key="tracking"
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex gap-4">
                    <div className="flex -space-x-4">
                      {order.items.slice(0, 3).map((item, i) => (
                        <div key={i} className="w-16 h-16 rounded-xl bg-white p-1 border border-gray-200 shadow-sm overflow-hidden">
                          <img src={item.image} className="w-full h-full object-contain" alt="" />
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 pl-4">
                      <p className="text-gray-500 text-xs uppercase font-bold">Total Amount</p>
                      <p className="text-2xl font-black text-gray-900">₹{order.total}</p>
                      <p className="text-sm text-gray-500">{order.items.length} Items</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-gray-900">Shipment Status</h3>
                      {isAdmin && (
                        <select 
                          value={currentStatus}
                          onChange={handleStatusChange}
                          disabled={isLoading}
                          className="bg-blue-50 text-blue-600 text-sm font-bold py-2 px-4 rounded-xl outline-none cursor-pointer border border-blue-200 hover:bg-blue-100 transition-all"
                        >
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      )}
                    </div>
                    <div className="relative pl-4 border-l-2 border-gray-200 space-y-8">
                      {trackingSteps.map((step, index) => (
                        <div key={index} className="relative pl-8">
                          <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 transition-all ${
                            step.completed 
                              ? 'bg-blue-500 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
                              : 'bg-white border-gray-300'
                          }`}></div>
                          <h4 className={`font-bold text-lg ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>{step.title}</h4>
                          <p className="text-sm text-gray-500">{step.date}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <button 
                      type="button" 
                      onClick={() => setView('confirm')}
                      className="w-full py-4 rounded-xl border border-red-100 text-red-600 font-bold hover:bg-red-50 hover:text-red-700 transition-all"
                    >
                      Cancel Order
                    </button>
                  </div>
                </motion.div>
              )}

              {view === 'confirm' && (
                <motion.div 
                  key="confirm"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-pulse">!</div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2">Are you sure?</h3>
                  <p className="text-gray-500 mb-8 max-w-xs mx-auto">This action cannot be undone. You will be refunded to your original payment method.</p>
                  <div className="flex gap-4">
                    <button type="button" disabled={isLoading} onClick={() => setView('tracking')} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-900 font-bold hover:bg-gray-200 transition disabled:opacity-50">No, Keep Order</button>
                    <button type="button" disabled={isLoading} onClick={executeCancellation} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-500/20 transition disabled:opacity-50">
                      {isLoading ? (
                         <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : 'Yes, Cancel'}
                    </button>
                  </div>
                </motion.div>
              )}

              {view === 'cancelled' && (
                <motion.div key="cancelled" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <CancelAnim onClose={onClose} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OrderTrackerModal;