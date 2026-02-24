import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SuccessAnim from './SuccessAnim';

const CheckoutModal = ({ isOpen, onClose, onFinalSuccess, onSubmit, cart, total }) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
    
    setIsLoading(true);

    const addr = addresses.find(a => a.id === selectedAddressId);
    const fullAddress = `${addr.address}, ${addr.city}, ${addr.zip}`;
    const userEmail = localStorage.getItem('userEmail') || "Guest";
    
    const orderData = {
      email: userEmail, customerName: addr.name, phone: addr.phone, address: fullAddress, 
      items: cart, total: grandTotal, paymentMethod: paymentMethod,
      transactionId: paymentMethod === 'UPI' ? paymentDetails.upiId : 'N/A'
    };

    try {
      await onSubmit(orderData); 
      setIsSuccess(true);
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalClose = () => {
    setIsSuccess(false);
    onFinalSuccess(); 
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />

        <motion.div 
          className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} layout
        >
          {!isSuccess ? (
            <div className="flex flex-col h-full overflow-hidden min-h-0">
               <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                 <h2 className="text-2xl font-black text-gray-900 uppercase">Secure Checkout</h2>
                 <button onClick={onClose} type="button" disabled={isLoading} className="text-gray-400 hover:text-gray-900 text-xl disabled:opacity-50">✕</button>
               </div>
               
               <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-8 min-h-0">
                 <div>
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-bold text-gray-900">Delivery Address</h3>
                     {!isFormOpen && (
                       <button type="button" onClick={() => setIsFormOpen(true)} className="text-blue-600 text-sm font-bold hover:text-blue-700">+ Add New</button>
                     )}
                   </div>

                   {isFormOpen ? (
                     <form onSubmit={handleSaveAddress} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4 shadow-sm">
                       <input required placeholder="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-transparent border-b border-gray-300 p-2 text-gray-900 outline-none focus:border-blue-600 transition-colors" />
                       <input required placeholder="Phone Number" type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-transparent border-b border-gray-300 p-2 text-gray-900 outline-none focus:border-blue-600 transition-colors" />
                       <textarea required placeholder="Street Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-transparent border-b border-gray-300 p-2 text-gray-900 outline-none focus:border-blue-600 resize-none transition-colors" />
                       <div className="flex gap-4">
                         <input required placeholder="City" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-1/2 bg-transparent border-b border-gray-300 p-2 text-gray-900 outline-none focus:border-blue-600 transition-colors" />
                         <input required placeholder="ZIP Code" value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})} className="w-1/2 bg-transparent border-b border-gray-300 p-2 text-gray-900 outline-none focus:border-blue-600 transition-colors" />
                       </div>
                       <div className="flex gap-2 pt-2">
                         <button type="button" onClick={() => { setIsFormOpen(false); setEditingId(null); }} className="flex-1 py-2 text-gray-500 hover:text-gray-900 font-bold">Cancel</button>
                         <button type="submit" className="flex-1 bg-blue-600 py-2 rounded-lg font-bold text-white hover:bg-blue-700 shadow-md">Save Address</button>
                       </div>
                     </form>
                   ) : (
                     <div className="space-y-3">
                       {addresses.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">No addresses saved. Please add one.</p>
                       ) : (
                         addresses.map(addr => (
                           <div key={addr.id} onClick={() => setSelectedAddressId(addr.id)} className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                              <div className="flex justify-between items-start">
                               <div>
                                 <p className="font-bold text-gray-900">{addr.name} <span className="text-gray-500 text-sm font-normal block md:inline md:ml-2">{addr.phone}</span></p>
                                 <p className="text-sm text-gray-600 mt-1">{addr.address}, {addr.city} {addr.zip}</p>
                               </div>
                               <div className="flex gap-3 text-sm">
                                 <button type="button" onClick={(e) => { e.stopPropagation(); handleEdit(addr); }} className="text-blue-600 hover:text-blue-700 font-bold">Edit</button>
                                 <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(addr.id); }} className="text-red-500 hover:text-red-600 font-bold">Delete</button>
                               </div>
                             </div>
                           </div>
                         ))
                       )}
                     </div>
                   )}
                 </div>

                 <div>
                   <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Method</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                     {['Card', 'UPI', 'Cash on Delivery'].map(method => (
                       <button
                         key={method}
                         type="button"
                         onClick={() => setPaymentMethod(method)}
                         className={`p-3 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                           paymentMethod === method 
                           ? 'border-blue-600 bg-blue-600 text-white shadow-md' 
                           : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900'
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
                       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                         <div className="flex items-center justify-between mb-2">
                           <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Secure Card Payment</p>
                           <span className="text-xs text-blue-600 font-bold">Powered by Technologia</span>
                         </div>
                         <input type="text" placeholder="Card Number" maxLength="16" value={paymentDetails.cardNumber} onChange={e => setPaymentDetails({...paymentDetails, cardNumber: e.target.value.replace(/\D/g, '')})} className="w-full bg-white border border-gray-200 rounded-lg p-3 text-gray-900 outline-none focus:border-blue-500 tracking-widest shadow-sm" />
                         <div className="flex gap-4">
                           <input type="text" placeholder="MM/YY" maxLength="5" value={paymentDetails.expiry} onChange={e => setPaymentDetails({...paymentDetails, expiry: e.target.value})} className="w-1/2 bg-white border border-gray-200 rounded-lg p-3 text-gray-900 outline-none focus:border-blue-500 shadow-sm" />
                           <input type="password" placeholder="CVV" maxLength="4" value={paymentDetails.cvv} onChange={e => setPaymentDetails({...paymentDetails, cvv: e.target.value.replace(/\D/g, '')})} className="w-1/2 bg-white border border-gray-200 rounded-lg p-3 text-gray-900 outline-none focus:border-blue-500 tracking-widest shadow-sm" />
                         </div>
                       </motion.div>
                     )}
                     
                     {paymentMethod === 'UPI' && (
                       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6">
                         <div className="bg-white p-6 rounded-2xl border border-gray-200 text-center shadow-sm">
                           <p className="text-gray-500 text-sm mb-2 uppercase tracking-widest font-bold">Scan & Pay to Admin</p>
                           <div className="w-40 h-40 bg-white rounded-2xl mx-auto flex items-center justify-center p-2 mb-4 shadow-md border border-gray-100 transition-transform hover:scale-105">
                               <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${adminUPI}&pn=Technologia`} alt="Admin QR Code" className="w-full h-full object-contain" />
                           </div>
                           <p className="text-2xl font-black text-gray-900 tracking-widest mb-1">{adminUPI}</p>
                           <p className="text-sm text-blue-600 font-bold">{adminName} (Technologia Admin)</p>
                         </div>
                         <div>
                           <label className="block text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Verify Payment</label>
                           <input 
                             type="text" placeholder="Enter 12-digit UTR / Transaction ID" 
                             value={paymentDetails.upiId} 
                             onChange={e => setPaymentDetails({...paymentDetails, upiId: e.target.value.replace(/\D/g, '')})} 
                             maxLength="12"
                             className="w-full bg-white border border-gray-200 p-4 rounded-xl text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 tracking-widest shadow-sm transition-all" 
                           />
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>

                 <div>
                   <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Summary</h3>
                   <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-3 text-sm shadow-sm">
                     <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="font-bold">₹{total.toFixed(2)}</span></div>
                     <div className="flex justify-between text-gray-600"><span>Estimated Tax (18%)</span><span className="font-bold">₹{tax.toFixed(2)}</span></div>
                     <div className="flex justify-between text-gray-600"><span>Shipping</span><span className="font-bold">₹{shipping.toFixed(2)}</span></div>
                     <div className="border-t border-gray-200 pt-3 flex justify-between items-center mt-2">
                       <span className="text-lg font-bold text-gray-900">Grand Total</span>
                       <span className="text-2xl font-black text-blue-600">₹{grandTotal.toFixed(2)}</span>
                     </div>
                   </div>
                 </div>
               </div>
               
               <div className="p-6 border-t border-gray-200 bg-gray-50 shrink-0">
                 <button 
                   type="button" 
                   onClick={handleLocalSubmit} 
                   disabled={!selectedAddressId || isFormOpen || !isPaymentValid() || isLoading}
                   className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 py-4 rounded-xl font-black text-lg text-white hover:scale-[1.02] transition-transform shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
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