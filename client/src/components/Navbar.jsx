import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import CheckoutModal from './CheckoutModal';

const Navbar = ({ cart, removeFromCart, updateQuantity, isOpen, setIsOpen, clearCart, searchTerm, setSearchTerm, token, isAdmin, logout }) => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  
  // Calculate total factoring in quantity
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const userEmail = localStorage.getItem('userEmail') || "User";

  const handleCheckoutSubmit = async (orderData) => {
    try {
      await axios.post('${import.meta.env.VITE_API_URL}/orders', orderData);
      // Removed clearCart() and close functions here to allow CheckoutModal to show the success animation.
    } catch (err) { 
      alert("Failed to place order.");
      throw err; // Re-throw to prevent animation if failed
    }
  };

  const handleFinalSuccess = () => {
    clearCart();
    setIsOpen(false);
    setIsCheckoutOpen(false);
  };

  return (
    <>
      <nav className="bg-[#0f172a]/95 backdrop-blur-md text-white shadow-xl sticky top-0 z-40 p-4 border-b border-gray-800">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Link to="/" className="text-2xl font-black tracking-tighter hover:text-blue-400 transition">
            TECHNOLOGIA
          </Link>
          
          <div className="relative w-full md:w-1/3">
            <input 
              type="text"
              placeholder="Search gadgets..."
              className="w-full px-4 py-2 rounded-full bg-[#1e293b] text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-6">
            {token ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 hover:bg-[#1e293b] pr-4 pl-2 py-1 rounded-full transition-all border border-transparent hover:border-gray-700"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-sm font-bold shadow-lg">
                    {userEmail.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-xs text-gray-400">Signed in as</p>
                    <p className="text-xs font-bold text-white max-w-[100px] truncate">{userEmail}</p>
                  </div>
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#1e293b] border border-gray-700 rounded-xl shadow-2xl py-2 z-50">
                     <div className="px-4 py-3 border-b border-gray-700 mb-2">
                        <p className="text-xs text-gray-400">Account</p>
                        <p className="text-sm font-bold text-white truncate">{userEmail}</p>
                     </div>
                     {isAdmin && (
                       <Link to="/add" className="block px-4 py-2 text-sm hover:bg-blue-600 hover:text-white transition">Inventory Management</Link>
                     )}
                     <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-blue-600 hover:text-white transition">My Profile</Link>
                     <Link to="/orders" className="block px-4 py-2 text-sm hover:bg-blue-600 hover:text-white transition">Order History</Link>
                     <div className="border-t border-gray-700 mt-2 pt-2">
                       <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition">Sign Out</button>
                     </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="font-bold hover:text-blue-400 transition text-sm">Login</Link>
                <Link to="/signup" className="bg-white text-black px-4 py-2 rounded-full font-bold hover:bg-gray-200 transition text-sm">Signup</Link>
              </div>
            )}

            <button onClick={() => setIsOpen(true)} className="relative p-2 hover:bg-[#1e293b] rounded-full transition-all group">
              <span className="text-2xl">🛍️</span>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#0f172a]">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {isOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={() => setIsOpen(false)}></div>}
      
      <div className={`fixed top-0 right-0 h-full w-85 md:w-96 bg-[#0f172a] text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-gray-700 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-[#1e293b]">
          <h2 className="text-2xl font-black">Your Bag</h2>
          <button onClick={() => setIsOpen(false)} className="text-3xl text-gray-400 hover:text-white">&times;</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.map((item) => (
             <div key={item._id} className="flex gap-4 items-center pb-4 border-b border-gray-700">
                <img src={item.image} className="w-12 h-12 object-contain bg-white rounded-md"/>
                <div className="flex-1">
                  <p className="font-bold text-gray-200 line-clamp-1">{item.name}</p>
                  <p className="text-blue-400 font-black">₹{item.price}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => updateQuantity(item._id, -1)} className="px-2 bg-gray-800 rounded text-sm">-</button>
                    <span className="text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item._id, 1)} className="px-2 bg-gray-800 rounded text-sm">+</button>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item._id)} className="text-red-400 text-sm font-bold p-2 hover:bg-red-400/10 rounded">✕</button>
             </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-gray-700 bg-[#1e293b] space-y-4">
             <div className="flex justify-between text-xl font-black">
                <span>Subtotal</span><span>₹{total.toFixed(2)}</span>
             </div>
             <button onClick={() => setIsCheckoutOpen(true)} className="w-full bg-green-500 py-4 rounded-xl font-bold text-black hover:bg-green-400">Checkout</button>
          </div>
        )}
      </div>

      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        onFinalSuccess={handleFinalSuccess} 
        onSubmit={handleCheckoutSubmit} 
        cart={cart}
        total={total} 
      />
    </>
  );
};

export default Navbar;