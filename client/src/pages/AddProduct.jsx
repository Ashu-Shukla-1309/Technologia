import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const AddProduct = ({ fetchProducts }) => {
  // 🚀 Added inStock to formData
  const [formData, setFormData] = useState({ 
    name: '', 
    price: '', 
    category: 'Electronics', 
    image: '', 
    description: '',
    inStock: true 
  });
  
  const [products, setProducts] = useState([]);
  // 🚀 Tracks which product we are currently editing
  const [editingId, setEditingId] = useState(null); 
  const navigate = useNavigate();

  useEffect(() => { refreshInventory(); }, []);

  const refreshInventory = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`);
      if (Array.isArray(res.data)) {
        setProducts(res.data);
      } else {
        setProducts([]);
      }
    } catch (err) { 
      console.error("Failed to load inventory", err); 
      setProducts([]);
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // 🚀 UPDATE Existing Product
        await axios.put(`${import.meta.env.VITE_API_URL}/api/products/${editingId}`, formData);
        alert('Product Updated Successfully!');
      } else {
        // 🚀 ADD New Product
        await axios.post(`${import.meta.env.VITE_API_URL}/api/products`, formData);
        alert('Product Added Successfully!');
      }
      
      resetForm();
      fetchProducts();
      refreshInventory();
    } catch (err) { 
      alert(editingId ? 'Error updating product' : 'Error adding product'); 
    }
  };

  const handleEditClick = (product) => {
    setEditingId(product._id);
    setFormData({
      name: product.name || '',
      price: product.price || '',
      category: product.category || 'Electronics',
      image: product.image || '',
      description: product.description || '',
      inStock: product.inStock !== false // defaults to true if undefined
    });
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll up to the form
  };

  const handleToggleStock = async (product) => {
    try {
      const updatedStock = product.inStock === false ? true : false;
      await axios.put(`${import.meta.env.VITE_API_URL}/api/products/${product._id}`, { 
        ...product, 
        inStock: updatedStock 
      });
      refreshInventory();
      fetchProducts();
    } catch (err) {
      alert("Failed to change stock status");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/products/${id}`);
        if (editingId === id) resetForm(); // Clear form if deleting the item being edited
        refreshInventory(); 
        fetchProducts();
      } catch (err) { alert("Failed to delete product"); }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', price: '', category: 'Electronics', image: '', description: '', inStock: true });
  };

  const safeProducts = Array.isArray(products) ? products : [];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* FORM SECTION */}
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm h-fit sticky top-24">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-black text-blue-600 uppercase tracking-tighter">
              {editingId ? "Edit Product" : "Add Inventory"}
            </h2>
            {editingId && (
              <button onClick={resetForm} className="text-sm font-bold text-gray-500 hover:text-red-500 transition-colors">
                Cancel Edit ✕
              </button>
            )}
          </div>

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

            {/* 🚀 ADDED: In Stock Checkbox */}
            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <input type="checkbox" name="inStock" checked={formData.inStock} onChange={handleChange} className="w-5 h-5 accent-blue-600 cursor-pointer" id="inStockCheck" />
              <label htmlFor="inStockCheck" className="text-gray-700 font-bold cursor-pointer select-none">
                Item is currently in stock
              </label>
            </div>

            <button type="submit" className={`w-full py-4 rounded-xl font-black text-lg text-white hover:scale-[1.02] transition-transform shadow-lg ${editingId ? 'bg-gradient-to-r from-green-500 to-teal-500 shadow-green-500/30' : 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-blue-500/30'}`}>
              {editingId ? "Update Product" : "+ Add to Store"}
            </button>
          </form>
        </motion.div>

        {/* INVENTORY LIST SECTION */}
        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
           <h2 className="text-3xl font-black mb-6 text-gray-900 uppercase tracking-tighter">Current Stock ({safeProducts.length})</h2>
           <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
             <AnimatePresence>
               {safeProducts.map(product => {
                 const isStocked = product.inStock !== false; // True by default
                 return (
                 <motion.div key={product._id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center gap-4 group hover:shadow-md transition-all">
                   
                   <div className="w-20 h-20 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center p-2 relative">
                     <img src={product.image} alt={product.name} className={`w-full h-full object-contain mix-blend-multiply ${!isStocked && 'opacity-50 grayscale'}`} />
                   </div>
                   
                   <div className="flex-1">
                     <h3 className={`font-bold ${!isStocked ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{product.name}</h3>
                     <div className="flex items-center gap-3 mt-1">
                        <p className="text-blue-600 font-black">₹{product.price}</p>
                        
                        {/* 🚀 Quick Toggle Stock Button */}
                        <button 
                          onClick={() => handleToggleStock(product)}
                          className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-colors ${isStocked ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}
                        >
                          {isStocked ? '● In Stock' : '○ Out of Stock'}
                        </button>
                     </div>
                   </div>

                   <div className="flex flex-col gap-2">
                     <button onClick={() => handleEditClick(product)} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-xs font-bold border border-blue-100">Edit</button>
                     <button onClick={() => handleDelete(product._id)} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl hover:bg-red-500 hover:text-white transition-all text-xs font-bold border border-red-100">Delete</button>
                   </div>
                 </motion.div>
               )})}
             </AnimatePresence>
           </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AddProduct;