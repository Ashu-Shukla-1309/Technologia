import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Return Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnOrderDetails, setReturnOrderDetails] = useState(null);
  const [returnForm, setReturnForm] = useState({ type: 'Refund', reason: '' });

  // 🚀 NEW: Cancel Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelOrderDetails, setCancelOrderDetails] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const userEmail = localStorage.getItem('userEmail');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const url = isAdmin 
        ? `${import.meta.env.VITE_API_URL}/api/orders` 
        : `${import.meta.env.VITE_API_URL}/api/orders?email=${userEmail}`;
        
      const res = await axios.get(url);
      setOrders(res.data);
    } catch (err) {
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    const loadingToast = toast.loading("Updating status...");
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/orders/${orderId}/status`, { 
        status: newStatus, 
        adminEmail: userEmail 
      });
      toast.success("Order status updated!", { id: loadingToast });
      fetchOrders(); 
    } catch (err) {
      toast.error("Failed to update status", { id: loadingToast });
    }
  };

  const openReturnModal = (order) => {
    setReturnOrderDetails(order);
    setReturnForm({ type: 'Refund', reason: '' });
    setIsReturnModalOpen(true);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnForm.reason.trim()) return toast.error("Please provide a reason.");

    const loadingToast = toast.loading("Sending request to admin...");
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/orders/${returnOrderDetails._id}/return`, {
        type: returnForm.type,
        reason: returnForm.reason,
        userEmail: userEmail
      });
      
      toast.success("Request sent! Our team will contact you shortly.", { id: loadingToast });
      setIsReturnModalOpen(false);
      fetchOrders(); 
    } catch (err) {
      toast.error("Failed to submit request", { id: loadingToast });
    }
  };

  // 🚀 NEW: Open Cancel Modal
  const openCancelModal = (order) => {
    setCancelOrderDetails(order);
    setCancelReason('');
    setIsCancelModalOpen(true);
  };

  // 🚀 NEW: Submit Cancel Request
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) return toast.error("Please provide a reason for cancellation.");

    const loadingToast = toast.loading("Cancelling order...");
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/orders/${cancelOrderDetails._id}/cancel`, {
        reason: cancelReason
      });
      
      toast.success("Order cancelled successfully.", { id: loadingToast });
      setIsCancelModalOpen(false);
      fetchOrders(); // Refresh to update status on screen
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to cancel order", { id: loadingToast });
    }
  };

  const getStatusColor = (status) => {
    if (status.includes('Delivered')) return 'bg-green-100 text-green-700 border-green-200';
    if (status.includes('Shipped')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (status.includes('Return') || status.includes('Cancelled')) return 'bg-red-100 text-red-700 border-red-200';
    return 'bg-yellow-100 text-yellow-700 border-yellow-200'; 
  };

  const statusOptions = ["Processing", "Shipped", "Delivered", "Cancelled", "Refunded", "Replaced"];

  return (
    <div className="min-h-screen bg-slate-50 py-24 px-6 font-sans">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-slate-200 pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              {isAdmin ? "Global Order Management" : "My Orders"}
            </h1>
            <p className="text-gray-500 mt-2">
              {isAdmin ? "Track, update, and manage all customer purchases." : "View and manage your recent purchases."}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-white animate-pulse rounded-3xl border border-gray-100 shadow-sm"></div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-500 mb-4">{isAdmin ? "No orders have been placed yet." : "You haven't placed any orders yet."}</h3>
            {!isAdmin && (
              <Link to="/" className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition">
                Start Shopping
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {orders.map((order) => (
                <motion.div key={order._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col gap-6">
                  
                  {/* Order Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6">
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Order #{order._id}</p>
                      <p className="text-gray-900 font-bold">Placed on {new Date(order.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      {isAdmin && (
                        <p className="text-blue-600 font-bold text-sm mt-1">Customer: {order.email}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {isAdmin ? (
                        <select 
                          value={order.status}
                          onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                          className={`font-bold text-sm px-4 py-2 rounded-full border outline-none cursor-pointer shadow-sm ${getStatusColor(order.status)}`}
                        >
                          <option value={order.status}>{order.status} (Current)</option>
                          <option disabled>──────────</option>
                          {statusOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`font-bold text-sm px-4 py-2 rounded-full border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      )}
                      
                      <h3 className="text-2xl font-black text-gray-900">₹{order.total.toLocaleString('en-IN')}</h3>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <img src={item.image} alt={item.name} className="w-16 h-16 object-contain mix-blend-multiply" />
                        <div>
                          <p className="font-bold text-gray-900 line-clamp-1">{item.name}</p>
                          <p className="text-gray-500 text-sm">Qty: {item.quantity || 1} <span className="mx-2">•</span> ₹{(item.price * (item.quantity || 1)).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 🚀 NEW: Admin Dashboard Context (Shows why it was cancelled) */}
                  {(isAdmin || order.status === "Cancelled") && order.cancelReason && (
                     <div className="bg-red-50 text-red-800 p-4 rounded-xl text-sm font-bold border border-red-200 mt-2">
                       <p className="mb-1">⚠️ Cancellation Reason: <span className="font-normal">{order.cancelReason}</span></p>
                       <p className="text-xs font-normal text-red-600">Cancelled on: {new Date(order.cancelDate).toLocaleDateString('en-IN')}</p>
                     </div>
                  )}

                  {/* USER ACTIONS: Buttons Group */}
                  {!isAdmin && (
                    <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                      
                      {/* Show Cancel Button ONLY if it's currently Processing */}
                      {order.status === "Processing" && (
                        <button 
                          onClick={() => openCancelModal(order)}
                          className="bg-white border border-red-200 text-red-600 px-6 py-2 rounded-full font-bold hover:bg-red-50 hover:border-red-300 transition-all text-sm shadow-sm"
                        >
                          Cancel Order
                        </button>
                      )}

                      {/* Return/Replace for Delivered Items */}
                      {order.status === "Delivered" && (
                        <button 
                          onClick={() => openReturnModal(order)}
                          className="bg-white border-2 border-slate-900 text-slate-900 px-6 py-2 rounded-full font-bold hover:bg-slate-900 hover:text-white transition-all text-sm shadow-sm"
                        >
                          Return or Replace Item
                        </button>
                      )}
                    </div>
                  )}

                  {!isAdmin && order.status.includes("Return Requested") && (
                    <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl text-sm font-bold border border-yellow-200 text-center">
                      Your return/replace request is currently being reviewed by our team. Check your email for updates.
                    </div>
                  )}

                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* RETURN / REPLACE MODAL */}
      <AnimatePresence>
        {isReturnModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsReturnModalOpen(false)} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10 p-8 border border-gray-100">
              <h2 className="text-2xl font-black text-gray-900 mb-2">Initiate Return</h2>
              <p className="text-gray-500 text-sm mb-6">Order #{returnOrderDetails?._id.toString().slice(-6).toUpperCase()}</p>
              
              <form onSubmit={handleReturnSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-bold mb-3 text-sm">What would you like to do?</label>
                  <div className="flex gap-4">
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${returnForm.type === 'Refund' ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-gray-200 hover:border-blue-300'}`}>
                      <input type="radio" name="type" value="Refund" checked={returnForm.type === 'Refund'} onChange={(e) => setReturnForm({...returnForm, type: e.target.value})} className="hidden" />
                      💸 Refund
                    </label>
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${returnForm.type === 'Replace' ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold' : 'border-gray-200 hover:border-blue-300'}`}>
                      <input type="radio" name="type" value="Replace" checked={returnForm.type === 'Replace'} onChange={(e) => setReturnForm({...returnForm, type: e.target.value})} className="hidden" />
                      📦 Replace
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-2 text-sm">Reason for {returnForm.type}</label>
                  <textarea 
                    value={returnForm.reason} 
                    onChange={(e) => setReturnForm({...returnForm, reason: e.target.value})} 
                    placeholder="E.g., Item was damaged, wrong size, changed my mind..." 
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm resize-none h-32"
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={() => setIsReturnModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition">Cancel</button>
                  <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-md shadow-blue-500/30">Submit Request</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🚀 NEW: CANCEL ORDER MODAL */}
      <AnimatePresence>
        {isCancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCancelModalOpen(false)} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10 p-8 border border-red-100">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-red-600 text-xl font-black">!</span>
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Cancel Order</h2>
              <p className="text-gray-500 text-sm mb-6">You are about to cancel Order #{cancelOrderDetails?._id.toString().slice(-6).toUpperCase()}</p>
              
              <form onSubmit={handleCancelSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-bold mb-2 text-sm">Please tell us why you are cancelling:</label>
                  <textarea 
                    value={cancelReason} 
                    onChange={(e) => setCancelReason(e.target.value)} 
                    placeholder="E.g., Found a better price, ordered by mistake, shipping too long..." 
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 outline-none focus:border-red-500 focus:bg-white transition-all shadow-sm resize-none h-32"
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={() => setIsCancelModalOpen(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition">Go Back</button>
                  <button type="submit" className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition shadow-md shadow-red-500/30">Confirm Cancel</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Orders;