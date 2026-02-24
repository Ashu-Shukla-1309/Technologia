import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SuccessAnim from './SuccessAnim';

const CheckoutModal = ({ isOpen, onClose, onFinalSuccess, onSubmit, cart, total }) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // 🚀 NEW: Loading State
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', city: '', zip: '' });
  
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [paymentDetails, setPaymentDetails] = useState({ upiId: '', cardNumber: '', expiry: '', cvv: '' });

  const tax = total * 0.18; 
  const shipping = total > 0 ? 150 : 0; 
  const grandTotal = total + tax + shipping;

  const adminUPI = import.meta.env.VITE_ADMIN_UPI || "admin@upi";
  const adminName = import.meta.env.VITE_ADMIN_NAME || "Store Admin";

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedAddresses')) || [];
    setAddresses(saved);
    if (saved.length > 0 && !selectedAddressId) {
      setSelectedAddressId(saved[0].id);
    }
  }, []);

  const saveToLocal = (newAddresses) => {
    localStorage.setItem('savedAddresses', JSON.stringify(newAddresses));
    setAddresses(newAddresses);
  };

  if (!isOpen) return null;

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (editingId) {
      const updated = addresses.map(a => a.id === editingId ? { ...formData, id: editingId } : a);
      saveToLocal(updated);
    } else {
      const newAddr = { ...formData, id: Date.now().toString() };
      saveToLocal([...addresses, newAddr]);
      setSelectedAddressId(newAddr.id);
    }
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ name: '', phone: '', address: '', city: '', zip: '' });
  };

  const handleEdit = (addr) => {
    setFormData(addr);
    setEditingId(addr.id);
    setIsFormOpen(true);
  };

  const handleDelete = (id) => {
    const updated = addresses.filter(a => a.id !== id);
    saveToLocal(updated);
    if (selectedAddressId === id) setSelectedAddressId(updated.length > 0 ? updated[0].id : null);
  };

  const isPaymentValid = () => {
    if (paymentMethod === 'Card') return paymentDetails.cardNumber.length >= 15 && paymentDetails.expiry && paymentDetails.cvv.length >= 3;
    if (paymentMethod === 'UPI') return paymentDetails.upiId.length >= 8; 
    return true; 
  };

  const handleLocalSubmit = async (e) => {
    e.preventDefault(); 
    if (!selectedAddressId) return alert("Please select or add a delivery address.");
    
    setIsLoading(true); // 🚀 Start loading animation

    const addr = addresses.find(a => a.id === selectedAddressId);
    const fullAddress = `${addr.address}, ${addr.city}, ${addr.zip}`;
    const userEmail = localStorage.getItem('userEmail') || "Guest";

    const orderData = {
      email: userEmail, 
      customerName: addr.name, 
      phone: addr.phone, 
      address: fullAddress, 
      items: cart, 
      total: grandTotal,
      paymentMethod: paymentMethod,
      transactionId: paymentMethod === 'UPI' ? paymentDetails.upiId : 'N/A'
    };

    try {
      await onSubmit(orderData); 
      setIsSuccess(true); 
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsLoading(false); // 🚀 Stop loading animation
    }
  };

  const handleFinalClose = () => {
    setIsSuccess(false);
    onFinalSuccess(); 
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" />

        <motion.div 
          className="relative bg-[#0f172a] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]"
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} layout
        >
          {!isSuccess ? (
            <div className="flex flex-col h-full overflow-hidden min-h-0">
               <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#1e293b] shrink-0">
                 <h2 className="text-2xl font-black text-white uppercase">Secure Checkout</h2>
                 <button onClick={onClose} type="button" disabled={isLoading} className="text-gray-400 hover:text-white text-xl disabled:opacity-50">✕</button>
               </div>
               
               <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-8 min-h-0">
                 <div>
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-bold text-gray-300">Delivery Address</h3>
                     {!isFormOpen && (
                       <button type="button" onClick={() => setIsFormOpen(true)} className="text-blue-400 text-sm font-bold hover:text-blue-300">+ Add New</button>
                     )}
                   </div>

                   {isFormOpen ? (
                     <form onSubmit={handleSaveAddress} className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                       <input required placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-transparent border-b border-gray-600 p-2 text-white outline-none focus:border-blue-500" />
                       <input required placeholder="Phone Number" type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-transparent border-b border-gray-600 p-2 text-white outline-none focus:border-blue-500" />
                       <textarea required placeholder="Street Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-transparent border-b border-gray-600 p-2 text-white outline-none focus:border-blue-500 resize-none" />
                       <div className="flex gap-4">
                         <input required placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-1/2 bg-transparent border-b border-gray-600 p-2 text-white outline-none focus:border-blue-500" />
                         <input required placeholder="ZIP Code" value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})} className="w-1/2 bg-transparent border-b border-gray-600 p-2 text-white outline-none focus:border-blue-500" />
                       </div>
                       <div className="flex gap-2 pt-2">
                         <button type="button" onClick={() => { setIsFormOpen(false); setEditingId(null); }} className="flex-1 py-2 text-gray-400 hover:text-white">Cancel</button>
                         <button type="submit" className="flex-1 bg-blue-600 py-2 rounded-lg font-bold text-white hover:bg-blue-500">Save Address</button>
                       </div>
                     </form>
                   ) : (
                     <div className="space-y-3">
                       {addresses.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">No addresses saved. Please add one.</p>
                       ) : (
                         addresses.map(addr => (
                           <div key={addr.id} onClick={() => setSelectedAddressId(addr.id)} className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-white/5 hover:border-gray-500'}`}>
                             <div className="flex justify-between items-start">
                               <div>
                                 <p className="font-bold text-white">{addr.name} <span className="text-gray-400 text-sm font-normal block md:inline md:ml-2">{addr.phone}</span></p>
                                 <p className="text-sm text-gray-400 mt-1">{addr.address}, {addr.city} {addr.zip}</p>
                               </div>
                               <div className="flex gap-3 text-sm">
                                 <button type="button" onClick={(e) => { e.stopPropagation(); handleEdit(addr); }} className="text-blue-400 hover:text-blue-300">Edit</button>
                                 <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(addr.id); }} className="text-red-400 hover:text-red-300">Delete</button>
                               </div>
                             </div>
                           </div>
                         ))
                       )}
                     </div>
                   )}
                 </div>

                 <div>
                   <h3 className="text-lg font-bold text-gray-300 mb-4">Payment Method</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                     {['Card', 'UPI', 'Cash on Delivery'].map(method => (
                       <button
                         key={method}
                         type="button"
                         onClick={() => setPaymentMethod(method)}
                         className={`p-3 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                           paymentMethod === method 
                           ? 'border-blue-500 bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' 
                           : 'border-gray-700 bg-white/5 text-gray-400 hover:border-gray-500 hover:text-white'
                         }`}
                       >
                         {method === 'Card' && '💳 '}
                         {method === 'UPI' && '📱 '}
                         {method === 'Cash on Delivery' && '📦 '}
                         {method}
                       </button>
                     ))}
                   </div>

                   <AnimatePresence mode="wait">
                     {paymentMethod === 'Card' && (
                       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                         <div className="flex items-center justify-between mb-2">
                           <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Secure Card Payment</p>
                           <span className="text-xs text-blue-400">Powered by Technologia</span>
                         </div>
                         <input type="text" placeholder="Card Number" maxLength="16" value={paymentDetails.cardNumber} onChange={e => setPaymentDetails({...paymentDetails, cardNumber: e.target.value.replace(/\D/g, '')})} className="w-full bg-transparent border-b border-gray-600 p-2 text-white outline-none focus:border-blue-500 tracking-widest" />
                         <div className="flex gap-4">
                           <input type="text" placeholder="MM/YY" maxLength="5" value={paymentDetails.expiry} onChange={e => setPaymentDetails({...paymentDetails, expiry: e.target.value})} className="w-1/2 bg-transparent border-b border-gray-600 p-2 text-white outline-none focus:border-blue-500" />
                           <input type="password" placeholder="CVV" maxLength="4" value={paymentDetails.cvv} onChange={e => setPaymentDetails({...paymentDetails, cvv: e.target.value.replace(/\D/g, '')})} className="w-1/2 bg-transparent border-b border-gray-600 p-2 text-white outline-none focus:border-blue-500 tracking-widest" />
                         </div>
                       </motion.div>
                     )}
                     
                     {paymentMethod === 'UPI' && (
                       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-6">
                         <div className="bg-[#050b14] p-6 rounded-2xl border border-blue-500/30 text-center shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                           <p className="text-gray-400 text-sm mb-2 uppercase tracking-widest font-bold">Scan & Pay to Admin</p>
                           <div className="w-40 h-40 bg-white rounded-2xl mx-auto flex items-center justify-center p-3 mb-4 shadow-xl transition-transform hover:scale-105">
                              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${adminUPI}&pn=Technologia`} alt="Admin QR Code" className="w-full h-full object-contain" />
                           </div>
                           <p className="text-2xl font-black text-white tracking-widest mb-1">{adminUPI}</p>
                           <p className="text-sm text-blue-400 font-bold">{adminName} (Technologia Admin)</p>
                         </div>
                         <div>
                           <label className="block text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Verify Payment</label>
                           <input 
                             type="text" 
                             placeholder="Enter 12-digit UTR / Transaction ID" 
                             value={paymentDetails.upiId} 
                             onChange={e => setPaymentDetails({...paymentDetails, upiId: e.target.value.replace(/\D/g, '')})} 
                             maxLength="12"
                             className="w-full bg-[#050b14] border border-gray-600 p-4 rounded-xl text-white outline-none focus:border-blue-500 tracking-widest transition-all" 
                           />
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>

                 <div>
                   <h3 className="text-lg font-bold text-gray-300 mb-4">Payment Summary</h3>
                   <div className="bg-[#1e293b]/50 p-5 rounded-xl border border-gray-700 space-y-3 text-sm">
                     <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>₹{total.toFixed(2)}</span></div>
                     <div className="flex justify-between text-gray-400"><span>Estimated Tax (18%)</span><span>₹{tax.toFixed(2)}</span></div>
                     <div className="flex justify-between text-gray-400"><span>Shipping</span><span>₹{shipping.toFixed(2)}</span></div>
                     <div className="border-t border-gray-700 pt-3 flex justify-between items-center mt-2">
                       <span className="text-lg font-bold text-white">Grand Total</span>
                       <span className="text-2xl font-black text-blue-400">₹{grandTotal.toFixed(2)}</span>
                     </div>
                   </div>
                 </div>
               </div>
               
               <div className="p-6 border-t border-gray-800 bg-[#1e293b] shrink-0">
                 <button 
                   type="button" 
                   onClick={handleLocalSubmit} 
                   disabled={!selectedAddressId || isFormOpen || !isPaymentValid() || isLoading}
                   className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 py-4 rounded-xl font-black text-lg text-white hover:scale-[1.02] transition-transform shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                 >
                   {isLoading ? (
                     <>
                       <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                       Processing...
                     </>
                   ) : (
                     paymentMethod === 'Cash on Delivery' ? `Place Order • ₹${grandTotal.toFixed(2)}` : `Pay ₹${grandTotal.toFixed(2)} Securely`
                   )}
                 </button>
               </div>
            </div>
          ) : (
            <div className="p-8">
              <SuccessAnim onClose={handleFinalClose} />
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CheckoutModal;