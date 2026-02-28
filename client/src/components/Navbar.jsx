import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CheckoutModal from './CheckoutModal';

const Navbar = ({ cart, removeFromCart, updateQuantity, isOpen, setIsOpen, clearCart, searchTerm, setSearchTerm, token, isAdmin, logout }) => {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  
  // 🚀 NEW: Search State
  const [allProducts, setAllProducts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  
  const navigate = useNavigate();
  const dropdownRef = useRef(null); 
  const searchRef = useRef(null); // 🚀 NEW: Ref for search bar
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const userEmail = localStorage.getItem('userEmail') || "User";

  // Fetch all products once for instant local search filtering
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`);
        setAllProducts(res.data);
      } catch (err) {
        console.error("Failed to load products for search", err);
      }
    };
    fetchProducts();
  }, []);

  // Event listener to close dropdowns when clicking anywhere else on the screen
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 🚀 NEW: Handle Search Input
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value); // Keep your existing page filter working

    if (value.trim().length > 0) {
      const filtered = allProducts.filter(product => 
        product.name.toLowerCase().includes(value.toLowerCase()) || 
        product.category?.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5); // Limit to top 5 results
      
      setSearchResults(filtered);
      setIsSearchDropdownOpen(true);
    } else {
      setSearchResults([]);
      setIsSearchDropdownOpen(false);
    }
  };

  // 🚀 NEW: Handle Clicking a Search Result
  const handleSelectProduct = (productId) => {
    setIsSearchDropdownOpen(false);
    setSearchTerm(''); // Clear the search bar
    navigate(`/product/${productId}`); // Adjust this path if your product details page has a different route
  };

  const handleCheckoutSubmit = async (orderData) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/orders`, 
        orderData, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) { 
      // 🚀 NEW: Check if the error is a 403 (Forbidden / Expired Token)
      if (err.response && err.response.status === 403) {
        alert("Your session has expired. Please log in again to complete your order.");
        logout(); // Automatically logs them out and redirects to home
      } else {
        alert("Failed to place order. Please try again.");
      }
      throw err; 
    }
  };

  const handleFinalSuccess = () => {
    clearCart();
    setIsOpen(false);
    setIsCheckoutOpen(false);
  };

  const initiateCheckout = () => {
    if (!token) {
      alert("Please log in or sign up to place an order.");
      setIsOpen(false);
      navigate('/login'); 
    } else {
      setIsOpen(false); 
      setIsCheckoutOpen(true);
    }
  };

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-md text-gray-900 shadow-sm sticky top-0 z-40 p-4 border-b border-gray-200">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Link to="/" className="text-2xl font-black tracking-tighter hover:text-blue-600 transition">
            TECHNOLOGIA
          </Link>
          
          {/* --- SEARCH BAR SECTION --- */}
          <div className="relative w-full md:w-1/3" ref={searchRef}>
            <div className="relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text"
                placeholder="Search gadgets, categories..."
                className="w-full pl-12 pr-4 py-2.5 rounded-full bg-gray-100 text-gray-900 placeholder-gray-500 border border-transparent focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => searchTerm.trim().length > 0 && setIsSearchDropdownOpen(true)}
              />
            </div>

            {/* LIVE DROPDOWN RESULTS */}
            <AnimatePresence>
              {isSearchDropdownOpen && searchResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                >
                  <ul className="py-2">
                    {searchResults.map((product) => (
                      <li 
                        key={product._id} 
                        onClick={() => handleSelectProduct(product._id)}
                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-4 transition-colors border-b border-gray-50 last:border-0"
                      >
                        <img src={product.image} alt={product.name} className="w-10 h-10 object-contain mix-blend-multiply rounded-lg bg-gray-50 p-1" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate text-sm">{product.name}</p>
                          <p className="text-blue-600 font-bold text-xs mt-0.5">₹{product.price.toLocaleString('en-IN')}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* NO RESULTS STATE */}
              {isSearchDropdownOpen && searchTerm.trim().length > 0 && searchResults.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-6 text-center z-50"
                >
                  <p className="text-gray-500 font-medium text-sm">No products found matching "{searchTerm}"</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            
            {/* --- USER PROFILE / LOGIN SECTION --- */}
            {token ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2 hover:bg-gray-50 pr-4 pl-2 py-1 rounded-full transition-all border border-transparent hover:border-gray-200"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500
                  flex items-center justify-center text-sm font-bold shadow-md text-white">
                    {userEmail.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="text-xs font-bold text-gray-900 max-w-[150px] truncate">{userEmail}</p>
                  </div>
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50">
                     <div className="px-4 py-3 border-b border-gray-100 mb-2">
                        <p className="text-xs text-gray-500">Account</p>
                        <p className="text-sm font-bold text-gray-900 truncate">{userEmail}</p>
                     </div>
                     
                     {/* 👈 UPDATED: Both Admins AND Sellers can access Inventory Management */}
                     {(isAdmin || localStorage.getItem('userRole') === 'seller') && (
                       <Link onClick={() => setIsProfileDropdownOpen(false)} to="/add" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition font-bold">
                         Inventory Management
                       </Link>
                     )}

                     <Link onClick={() => setIsProfileDropdownOpen(false)} to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">My Profile</Link>
                     <Link onClick={() => setIsProfileDropdownOpen(false)} to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">Order History</Link>
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

            {/* --- ICONS SECTION (Wishlist & Cart) --- */}
            <div className="flex items-center gap-2 border-l border-gray-200 pl-4 md:pl-6">
              <Link to="/wishlist" title="Wishlist" className="relative p-2 hover:bg-gray-100 rounded-full transition-all flex items-center justify-center">
                <span className="text-2xl">❤️</span>
              </Link>

              <button onClick={() => setIsOpen(true)} title="Cart" className="relative p-2 hover:bg-gray-100 rounded-full transition-all group">
                <span className="text-2xl">🛍️</span>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* --- CART SIDEBAR --- */}
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

      {/* --- CHECKOUT MODAL --- */}
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