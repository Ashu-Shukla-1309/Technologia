import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const Wishlist = ({ products, addToCart }) => {
  const [wishlistIds, setWishlistIds] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('technologia_wishlist');
    if (saved) setWishlistIds(JSON.parse(saved));
  }, []);

  const removeFromWishlist = (id) => {
    const updated = wishlistIds.filter(itemId => itemId !== id);
    setWishlistIds(updated);
    localStorage.setItem('technologia_wishlist', JSON.stringify(updated));
    toast("Removed from wishlist", { icon: '💔' });
  };

  const wishlistedProducts = products.filter(p => wishlistIds.includes(p._id));

  return (
    <div className="min-h-screen bg-slate-50 py-24 px-6 font-sans">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center gap-4 mb-12 border-b border-slate-200 pb-6">
          <span className="text-4xl">❤️</span>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">My Wishlist</h1>
        </div>

        {wishlistedProducts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-500 mb-4">Your wishlist is empty.</h3>
            <Link to="/" className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-700 transition">
              Explore Gadgets
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {wishlistedProducts.map(product => {
              const isStocked = product.inStock !== false;
              
              return (
                <motion.div key={product._id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-5 rounded-[2rem] shadow-md hover:shadow-xl transition-all flex flex-col relative border border-gray-100">
                  <button onClick={() => removeFromWishlist(product._id)} className="absolute top-4 right-4 z-10 text-gray-400 hover:text-red-500 font-bold bg-white p-2 rounded-full shadow-sm hover:shadow-md transition">
                    ✕
                  </button>
                  <div className="h-48 flex items-center justify-center mb-4 bg-slate-50 rounded-2xl p-4">
                    <img src={product.image} alt={product.name} className={`h-full object-contain mix-blend-multiply ${!isStocked && 'opacity-50 grayscale'}`} />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <p className="text-xs text-blue-600 font-bold uppercase mb-1">{product.category}</p>
                    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">{product.name}</h3>
                    <div className="mt-auto flex justify-between items-center">
                      <span className="text-xl font-black text-gray-900">₹{product.price}</span>
                      {isStocked ? (
                        <button onClick={() => addToCart(product, 1)} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-600 transition">
                          Add to Cart
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">Out of Stock</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;