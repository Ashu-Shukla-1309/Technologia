import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const AddProduct = ({ fetchProducts }) => {
  const [formData, setFormData] = useState({ name: '', price: '', category: 'Electronics', image: '', description: '', inStock: true });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]); 
  const [sellers, setSellers] = useState([]); 
  const [currentUser, setCurrentUser] = useState(null); 
  const [editingId, setEditingId] = useState(null); 

  // 🚀 NEW: Admin Action Modal State
  const [actionModal, setActionModal] = useState({ isOpen: false, type: '', seller: null, reason: '' });

  const token = localStorage.getItem('token');
  const userEmail = localStorage.getItem('userEmail');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const authConfig = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => { 
    refreshInventory(); 
    fetchOrders(); 
    fetchCurrentUser();
    if (isAdmin) fetchSellers(); 
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/me`, authConfig);
      setCurrentUser(res.data);
    } catch (err) { console.error("Failed to load user info"); }
  };

  const refreshInventory = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`);
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) { setProducts([]); }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/orders`, authConfig);
      setOrders(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchSellers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/sellers`, authConfig);
      setSellers(res.data);
    } catch (err) { console.error("Failed to load sellers"); }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading(editingId ? "Updating product..." : "Adding to store...");
    try {
      if (editingId) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/products/${editingId}`, formData, authConfig);
        toast.success('Product Updated Successfully!', { id: loadingToast });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/products`, formData, authConfig);
        toast.success('Product Added Successfully!', { id: loadingToast });
      }
      resetForm();
      fetchProducts();
      refreshInventory();
    } catch (err) { 
      toast.error(err.response?.data?.error || (editingId ? 'Error updating product' : 'Error adding product'), { id: loadingToast }); 
    }
  };

  const handleEditClick = (product) => {
    setEditingId(product._id);
    setFormData({
      name: product.name || '', price: product.price || '', category: product.category || 'Electronics',
      image: product.image || '', description: product.description || '', inStock: product.inStock !== false 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleToggleStock = async (product) => {
    try {
      const updatedStock = !product.inStock;
      await axios.put(`${import.meta.env.VITE_API_URL}/api/products/${product._id}`, { ...product, inStock: updatedStock }, authConfig);
      toast.success(updatedStock ? "Item marked In Stock" : "Item marked Out of Stock");
      refreshInventory();
      fetchProducts();
    } catch (err) { toast.error("Failed to change stock status"); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/products/${id}`, authConfig);
        if (editingId === id) resetForm(); 
        toast.success("Product deleted");
        refreshInventory(); 
        fetchProducts();
      } catch (err) { toast.error("Failed to delete product"); }
    }
  };

  // 🛡️ ADMIN: Toggle Verification (No reason needed for this one)
  const handleToggleVerification = async (sellerId, currentStatus) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${sellerId}/verify-seller`, {
        isVerifiedSeller: !currentStatus
      }, authConfig);
      toast.success(!currentStatus ? "Seller Verified!" : "Seller Verification Revoked");
      fetchSellers(); 
    } catch (err) { toast.error("Failed to update seller verification"); }
  };

  // 🚀 ADMIN: Execute Ban or Delete AFTER reason is provided
  const executeAdminAction = async (e) => {
    e.preventDefault();
    const { type, seller, reason } = actionModal;
    if (!reason.trim() && type !== 'unban') return toast.error("A reason is required to notify the seller.");

    const loadingToast = toast.loading(`Executing ${type}...`);
    try {
      if (type === 'ban') {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${seller._id}/ban`, { isBanned: true, reason }, authConfig);
        toast.success(`${seller.name} has been banned.`, { id: loadingToast });
      } else if (type === 'unban') {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${seller._id}/ban`, { isBanned: false, reason: "Restored" }, authConfig);
        toast.success(`${seller.name} has been restored.`, { id: loadingToast });
      } else if (type === 'delete') {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/users/${seller._id}`, { 
          headers: authConfig.headers, 
          data: { reason } // axios.delete requires body to be inside a 'data' object
        });
        toast.success(`${seller.name} has been permanently deleted.`, { id: loadingToast });
      }
      
      setActionModal({ isOpen: false, type: '', seller: null, reason: '' });
      fetchSellers();
      refreshInventory();
    } catch (err) {
      toast.error(`Failed to ${type} seller`, { id: loadingToast });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', price: '', category: 'Electronics', image: '', description: '', inStock: true });
  };

  const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const safeProducts = Array.isArray(products) ? products : [];
  
  const isProfileIncomplete = currentUser?.role === 'seller' && (!currentUser.name || !currentUser.phone || !currentUser.address);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-12 font-sans relative">
      <div className="max-w-6xl mx-auto">
        
        {/* ADMIN ANALYTICS DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-center items-start">
            <p className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-2">Total Sales</p>
            <h3 className="text-4xl font-black text-blue-600">₹{totalSales.toLocaleString('en-IN')}</h3>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-center items-start">
            <p className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-2">Total Orders</p>
            <h3 className="text-4xl font-black text-purple-600">{totalOrders}</h3>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-center items-start">
            <p className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-2">Inventory Items</p>
            <h3 className="text-4xl font-black text-gray-900">{safeProducts.length}</h3>
          </motion.div>
        </div>

        {/* 🛡️ SELLER MANAGEMENT PANEL */}
        {isAdmin && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm mb-12">
            <h2 className="text-2xl font-black mb-6 text-gray-900 uppercase tracking-tighter">Manage Sellers</h2>
            {sellers.length === 0 ? (
              <p className="text-gray-500 italic">No registered sellers found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sellers.map(seller => (
                  <div key={seller._id} className={`border p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition ${seller.isBanned ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <p className={`font-black truncate ${seller.isBanned ? 'text-red-700' : 'text-gray-900'}`}>
                          {seller.name || 'Unnamed Seller'}
                          {seller.isBanned && <span className="ml-2 text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full uppercase">Banned</span>}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{seller.email}</p>
                      <p className="text-xs text-gray-400 mt-1">{seller.phone || 'No phone'}</p>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <button 
                        onClick={() => handleToggleVerification(seller._id, seller.isVerifiedSeller)}
                        disabled={seller.isBanned}
                        className={`w-full py-2 rounded-lg text-sm font-bold transition border ${seller.isBanned ? 'opacity-50 cursor-not-allowed bg-gray-200' : seller.isVerifiedSeller ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100' : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'}`}
                      >
                        {seller.isVerifiedSeller ? 'Revoke Verification' : 'Verify Seller'}
                      </button>
                      
                      <div className="flex gap-2">
                        {seller.isBanned ? (
                           <button onClick={() => executeAdminAction({preventDefault: () => {}, type: 'unban', seller, reason: ''}, setActionModal({ isOpen: false, type: 'unban', seller, reason: ''}))} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition">Restore Account</button>
                        ) : (
                           <button onClick={() => setActionModal({ isOpen: true, type: 'ban', seller, reason: '' })} className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition">Ban</button>
                        )}
                        <button onClick={() => setActionModal({ isOpen: true, type: 'delete', seller, reason: '' })} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-red-700 transition">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm h-fit sticky top-24">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black text-blue-600 uppercase tracking-tighter">
                {editingId ? "Edit Product" : "Add Inventory"}
              </h2>
              {editingId && (
                <button onClick={resetForm} className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors">Cancel Edit ✕</button>
              )}
            </div>

            {isProfileIncomplete ? (
              <div className="bg-orange-50 border border-orange-200 p-8 rounded-2xl text-center py-16">
                 <span className="text-6xl mb-6 block">🔒</span>
                 <h3 className="text-2xl font-black text-orange-800 mb-3">Action Required</h3>
                 <p className="text-orange-700 mb-8 font-medium">To protect buyers, you must add your Name, Phone Number, and Complete Address to your profile before listing products.</p>
                 <Link to="/profile" className="bg-orange-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-orange-700 transition shadow-md">Complete Profile</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Product Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm" placeholder="e.g. Quantum Processor X" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Price (₹)</label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm" placeholder="24999" />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Category</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm appearance-none font-bold">
                      <option>Electronics</option><option>Laptops</option><option>Accessories</option><option>Drones</option><option>VR Gear</option><option>Consoles</option><option>Smart Home</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Image URL</label>
                  <input type="text" name="image" value={formData.image} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm" placeholder="https://..." />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Product Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} required className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm resize-none h-24" placeholder="Enter details for the 'Know more' section..." />
                </div>

                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <input type="checkbox" name="inStock" checked={formData.inStock} onChange={handleChange} className="w-5 h-5 accent-blue-600 cursor-pointer" id="inStockCheck" />
                  <label htmlFor="inStockCheck" className="text-gray-700 font-bold cursor-pointer select-none">Item is currently in stock</label>
                </div>

                <button type="submit" className={`w-full py-4 rounded-xl font-black text-lg text-white hover:scale-[1.02] transition-transform shadow-lg ${editingId ? 'bg-gradient-to-r from-green-500 to-teal-500 shadow-green-500/30' : 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-blue-500/30'}`}>
                  {editingId ? "Update Product" : "+ Add to Store"}
                </button>
              </form>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
             <h2 className="text-3xl font-black mb-6 text-gray-900 uppercase tracking-tighter">Current Stock</h2>
             <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
               <AnimatePresence>
                 {safeProducts.map(product => {
                   const isStocked = product.inStock !== false;
                   const isOwnerOrAdmin = isAdmin || product.sellerEmail === userEmail;

                   return (
                   <motion.div key={product._id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center gap-4 group hover:shadow-md transition-all">
                     <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center p-2 relative">
                       <img src={product.image} alt={product.name} className={`w-full h-full object-contain mix-blend-multiply ${!isStocked && 'opacity-50 grayscale'}`} />
                     </div>
                     <div className="flex-1">
                       <h3 className={`font-bold ${!isStocked ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{product.name}</h3>
                       <div className="flex items-center gap-3 mt-1">
                          <p className="text-blue-600 font-black">₹{product.price}</p>
                          
                          {isOwnerOrAdmin ? (
                            <button onClick={() => handleToggleStock(product)} className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-colors ${isStocked ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}>
                              {isStocked ? '● In Stock' : '○ Out of Stock'}
                            </button>
                          ) : (
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full border cursor-default ${isStocked ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                              {isStocked ? '● In Stock' : '○ Out of Stock'}
                            </span>
                          )}
                       </div>
                       
                       {isAdmin && product.sellerEmail && (
                          <p className="text-[10px] text-gray-400 mt-1">Seller: {product.sellerEmail}</p>
                       )}
                     </div>

                     {isOwnerOrAdmin && (
                       <div className="flex flex-col gap-2">
                         <button onClick={() => handleEditClick(product)} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-xs font-bold border border-blue-100">Edit</button>
                         <button onClick={() => handleDelete(product._id)} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl hover:bg-red-500 hover:text-white transition-all text-xs font-bold border border-red-100">Delete</button>
                       </div>
                     )}
                   </motion.div>
                 )})}
               </AnimatePresence>
             </div>
          </motion.div>
        </div>
      </div>

      {/* 🚀 ADMIN REASON PROMPT MODAL */}
      <AnimatePresence>
        {actionModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActionModal({ isOpen: false, type: '', seller: null, reason: '' })} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={`relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10 p-8 border ${actionModal.type === 'delete' ? 'border-red-500' : 'border-slate-800'}`}>
              <h2 className="text-2xl font-black text-gray-900 mb-2 capitalize">{actionModal.type} Seller</h2>
              <p className="text-gray-500 text-sm mb-6">
                You are about to <strong className="text-gray-900">{actionModal.type}</strong> {actionModal.seller?.name || actionModal.seller?.email}. 
                {actionModal.type === 'delete' && " This action cannot be undone and will remove all their products."}
              </p>
              
              <form onSubmit={executeAdminAction} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-bold mb-2 text-sm">Reason for Action (Sent via Email)</label>
                  <textarea 
                    value={actionModal.reason} 
                    onChange={(e) => setActionModal({...actionModal, reason: e.target.value})} 
                    placeholder={`Why is this seller being ${actionModal.type}ned?`} 
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm resize-none h-32"
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={() => setActionModal({ isOpen: false, type: '', seller: null, reason: '' })} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition">Cancel</button>
                  <button type="submit" className={`flex-1 text-white py-3 rounded-xl font-bold transition shadow-md ${actionModal.type === 'delete' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' : 'bg-slate-900 hover:bg-slate-800'}`}>Confirm</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AddProduct;