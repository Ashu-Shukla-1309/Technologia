import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CancelAnim from './CancelAnim'; // Import the new animation

const OrderTrackerModal = ({ isOpen, onClose, order, onCancelOrder }) => {
  const [view, setView] = useState('tracking'); // 'tracking', 'confirm', or 'cancelled'
  
  useEffect(() => {
    if (isOpen) setView('tracking');
  }, [isOpen]);

  if (!isOpen || !order) return null;

  const trackingSteps = [
    { title: "Order Placed", date: new Date(order.date).toLocaleDateString(), completed: true },
    { title: "Processing", date: "In Progress", completed: true },
    { title: "Shipped", date: "Pending", completed: false },
    { title: "Out for Delivery", date: "Pending", completed: false },
    { title: "Delivered", date: "Pending", completed: false },
  ];

  const executeCancellation = async () => {
    // Call API from parent, wait for success boolean
    const success = await onCancelOrder(order._id);
    if (success) {
      setView('cancelled'); // Switch to animation view
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={view !== 'cancelled' ? onClose : undefined} // Prevent closing by clicking outside during animation
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        <motion.div 
          className="relative bg-[#0f172a] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]"
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} layout
        >
          {/* Header - Hidden if showing Cancel Animation */}
          {view !== 'cancelled' && (
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#1e293b]">
               <div>
                 <h2 className="text-xl font-black text-white uppercase tracking-wider">
                   {view === 'tracking' ? 'Track Order' : 'Cancel Order'}
                 </h2>
                 <p className="text-xs text-blue-400 font-mono">ID: {order._id}</p>
               </div>
               <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
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
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex gap-4">
                    <div className="flex -space-x-4">
                      {order.items.slice(0, 3).map((item, i) => (
                        <div key={i} className="w-16 h-16 rounded-xl bg-white p-1 border-2 border-[#0f172a] overflow-hidden">
                          <img src={item.image} className="w-full h-full object-contain" alt="" />
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="w-16 h-16 rounded-xl bg-[#1e293b] border-2 border-[#0f172a] flex items-center justify-center text-xs font-bold text-gray-400">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 pl-4">
                      <p className="text-gray-400 text-xs uppercase font-bold">Total Amount</p>
                      <p className="text-2xl font-black text-white">₹{order.total}</p>
                      <p className="text-sm text-gray-500">{order.items.length} Items</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white mb-6">Shipment Status</h3>
                    <div className="relative pl-4 border-l-2 border-gray-800 space-y-8">
                      {trackingSteps.map((step, index) => (
                        <div key={index} className="relative pl-8">
                          <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 transition-all ${
                            step.completed 
                              ? 'bg-green-500 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' 
                              : 'bg-[#0f172a] border-gray-600'
                          }`}></div>
                          <h4 className={`font-bold text-lg ${step.completed ? 'text-white' : 'text-gray-500'}`}>{step.title}</h4>
                          <p className="text-sm text-gray-500">{step.date}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-800">
                    <button 
                      onClick={() => setView('confirm')}
                      className="w-full py-4 rounded-xl border border-red-500/30 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all"
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
                  <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl animate-pulse">!</div>
                  <h3 className="text-2xl font-black text-white mb-2">Are you sure?</h3>
                  <p className="text-gray-400 mb-8 max-w-xs mx-auto">This action cannot be undone. You will be refunded to your original payment method.</p>
                  <div className="flex gap-4">
                    <button onClick={() => setView('tracking')} className="flex-1 py-3 rounded-xl bg-gray-800 text-white font-bold hover:bg-gray-700 transition">No, Keep Order</button>
                    <button onClick={executeCancellation} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 shadow-lg shadow-red-500/20 transition">Yes, Cancel</button>
                  </div>
                </motion.div>
              )}

              {view === 'cancelled' && (
                <motion.div key="cancelled">
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