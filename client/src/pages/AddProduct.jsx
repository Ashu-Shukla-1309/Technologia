import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const AddProduct = ({ fetchProducts }) => {
  const [formData, setFormData] = useState({ name: '', price: '', category: 'Electronics', image: '' });
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { refreshInventory(); }, []);

  const refreshInventory = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`);
      if (Array.isArray(res.data)) {
        setProducts(res.data);
      } else {
        setProducts([]);
        console.error("API did not return an array", res.data);
      }
    } catch (err) { 
      console.error("Failed to load inventory", err); 
      setProducts([]);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/products`, formData);
      alert('Product Added Successfully!');
      setFormData({ name: '', price: '', category: 'Electronics', image: '' }); 
      fetchProducts();
      refreshInventory();
    } catch (err) { alert('Error adding product'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/products/${id}`);
        refreshInventory(); 
        fetchProducts();
      } catch (err) { alert("Failed to delete product"); }
    }
  };

  const safeProducts = Array.isArray(products) ? products : [];

  return (
    <div className="min-h-screen bg-[#050b14] text-white p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="bg-[#1e293b] p-8 rounded-3xl border border-gray-700 h-fit sticky top-24">
          <h2 className="text-3xl font-black mb-6 text-blue-400 uppercase tracking-tighter">Add Inventory</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-400 text-sm font-bold mb-2">Product Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-[#0f172a] border border-gray-600 p-4 rounded-xl text-white outline-none focus:border-blue-500 transition-all" placeholder="e.g. Quantum Processor X" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2">Price (₹)</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} required className="w-full bg-[#0f172a] border border-gray-600 p-4 rounded-xl text-white outline-none focus:border-blue-500 transition-all" placeholder="24999" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2">Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-[#0f172a] border border-gray-600 p-4 rounded-xl text-white outline-none focus:border-blue-500 transition-all appearance-none">
                  <option>Electronics</option><option>Laptops</option><option>Accessories</option><option>Drones</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-bold mb-2">Image URL</label>
              <input type="text" name="image" value={formData.image} onChange={handleChange} required className="w-full bg-[#0f172a] border border-gray-600 p-4 rounded-xl text-white outline-none focus:border-blue-500 transition-all" placeholder="https://..." />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-4 rounded-xl font-black text-lg hover:scale-[1.02] transition-transform shadow-lg shadow-blue-500/20">+ Add to Store</button>
          </form>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
           <h2 className="text-3xl font-black mb-6 text-white uppercase tracking-tighter">Current Stock ({safeProducts.length})</h2>
           <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
             <AnimatePresence>
               {safeProducts.map(product => (
                 <motion.div key={product._id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-[#1e293b]/50 border border-gray-700 p-4 rounded-2xl flex items-center gap-4 group hover:bg-[#1e293b] transition-colors">
                   <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center p-2">
                     <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                   </div>
                   <div className="flex-1">
                     <h3 className="font-bold text-gray-200">{product.name}</h3>
                     <p className="text-blue-400 font-bold">₹{product.price}</p>
                   </div>
                   <button onClick={() => handleDelete(product._id)} className="bg-red-500/10 text-red-500 p-3 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20" title="Delete Item">✕</button>
                 </motion.div>
               ))}
             </AnimatePresence>
           </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AddProduct;