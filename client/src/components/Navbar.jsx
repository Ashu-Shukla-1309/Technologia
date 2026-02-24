import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import CheckoutModal from './CheckoutModal';

const Navbar = ({ cart, removeFromCart, updateQuantity, isOpen, setIsOpen, clearCart, searchTerm, setSearchTerm, token, isAdmin, logout }) => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const userEmail = localStorage.getItem('userEmail') || "User";

  const handleCheckoutSubmit = async (orderData) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/orders`, orderData);
    } catch (err) { 
      alert("Failed to place order.");
      throw err; 
    }
  };

  const handleFinalSuccess = () => {
    clearCart();
    setIsOpen(false);
    setIsCheckoutOpen(false);
  };

  const initiateCheckout = () => {
    setIsOpen(false); 
    setIsCheckoutOpen(true);
  };

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-md text-gray-900 shadow-sm sticky top-0 z-40 p-4 border-b border-gray-200">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Link to="/" className="text-2xl font-black tracking-tighter hover:text-blue-600 transition">
            TECHNOLOGIA
          </Link>
          
          <div className="relative w-full md:w-1/3">
            <input 
              type="text"
              placeholder="Search gadgets..."
              className="w-full px-4 py-2 rounded-full bg-gray-100 text-gray-900 placeholder-gray-500 border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-6">
            {token ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 hover:bg-gray-50 pr-4 pl-2 py-1 rounded-full transition-all border border-transparent hover:border-gray-200"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-sm font-bold shadow-md text-white">
                    {userEmail.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="text-xs font-bold text-gray-900 max-w-[100px] truncate">{userEmail}</p>
                  </div>
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50">
                     <div className="px-4 py-3 border-b border-gray-100 mb-2">
                        <p className="text-xs text-gray-500">Account</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{userEmail}</p>
                     </div>
                     {isAdmin && (
                       <Link to="/add" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">Inventory Management</Link>
                     )}
                     <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">My Profile</Link>
                     <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">Order History</Link>
                     <div className="border-t border-gray-100 mt-2 pt-2">
                       <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition">Sign Out</button>
                     </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="font-bold text-gray-700 hover:text-blue-600 transition text-sm">Login</Link>
                <Link to="/signup" className="bg-gray-900 text-white px-4 py-2 rounded-full font-bold hover:bg-blue-600 transition text-sm">Signup</Link>
              </div>
            )}

            <button onClick={() => setIsOpen(true)} className="relative p-2 hover:bg-gray-100 rounded-full transition-all group">
              <span className="text-2xl">🛍️</span>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {isOpen && <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40" onClick={() => setIsOpen(false)}></div>}
      
      <div className={`fixed top-0 right-0 h-full w-85 md:w-96 bg-gray-50 text-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-gray-200 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white">
          <h2 className="text-2xl font-black">Your Bag</h2>
          <button onClick={() => setIsOpen(false)} className="text-3xl text-gray-400 hover:text-gray-900">&times;</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.map((item) => (
             <div key={item._id} className="flex gap-4 items-center pb-4 border-b border-gray-200 bg-white p-3 rounded-xl shadow-sm">
                <img src={item.image} className="w-16 h-16 object-contain mix-blend-multiply" alt={item.name} />
                <div className="flex-1">
                  <p className="font-bold text-gray-900 line-clamp-1">{item.name}</p>
                  <p className="text-blue-600 font-black">₹{item.price}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => updateQuantity(item._id, -1)} className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm hover:bg-gray-200 transition">-</button>
                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item._id, 1)} className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm hover:bg-gray-200 transition">+</button>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item._id)} className="text-red-500 text-sm font-bold p-2 hover:bg-red-50 rounded-lg">✕</button>
             </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-white space-y-4">
             <div className="flex justify-between text-xl font-black text-gray-900">
               <span>Subtotal</span><span>₹{total.toFixed(2)}</span>
             </div>
             <button onClick={initiateCheckout} className="w-full bg-blue-600 py-4 rounded-xl font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30">Checkout</button>
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