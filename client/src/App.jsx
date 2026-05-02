import { useEffect, useState } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext'; // 🚀 IMPORT CONTEXT

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import AddProduct from './pages/AddProduct';
import Login from './pages/LoginTemp';
import Signup from './pages/Signup';
import Orders from './pages/Orders';
import VerifyOTP from './pages/VerifyOTP';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import ProductDetails from './components/ProductDetails';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true;

// 🛡️ SECURITY FIX: Silent Refresh Token Interceptor
axios.interceptors.response.use(
  (response) => {
    return response; 
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post('/api/auth/refresh');
        return axios(originalRequest);
      } catch (refreshError) {
        sessionStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// We extract Routes into a sub-component so we can use the useAuth hook inside AuthProvider
const AppRoutes = ({ products, isLoading, cart, setCart, addToCart, updateQuantity, removeFromCart, isCartOpen, setIsCartOpen, searchTerm, setSearchTerm, fetchProducts }) => {
  const { isAuthenticated, isAdmin, userRole } = useAuth(); // 🚀 USE CONTEXT

  return (
    <>
      <Navbar 
        cart={cart} 
        removeFromCart={removeFromCart}
        updateQuantity={updateQuantity}
        isOpen={isCartOpen} 
        setIsOpen={setIsCartOpen}
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm}
        clearCart={() => setCart([])}
      />

      <Routes>
        <Route path="/" element={
          <Home 
            products={products} 
            isLoading={isLoading}
            addToCart={addToCart} 
            fetchProducts={fetchProducts} 
            searchTerm={searchTerm} 
            isAdmin={isAdmin} 
          />
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify" element={<VerifyOTP />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/wishlist" element={<Wishlist products={products} addToCart={addToCart} />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/product/:id" element={<ProductDetails addToCart={addToCart} />} />
        
        <Route path="/add" element={(isAdmin || userRole === 'seller') ? <AddProduct fetchProducts={fetchProducts} /> : <Navigate to="/" />} />
      </Routes>
    </>
  );
};

function App() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products`);
      setProducts(res.data);
    } catch (err) {
      console.error("Fetch Error:", err);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const setupSecurityAndFetch = async () => {
      try {
        const csrfRes = await axios.get('/api/csrf-token');
        axios.defaults.headers.common['X-CSRF-Token'] = csrfRes.data.csrfToken;
        fetchProducts();
      } catch (err) {
        console.error("Failed to initialize secure session:", err);
        fetchProducts(); 
      }
    };
    setupSecurityAndFetch();
  }, []);

  const addToCart = (product, quantity = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item._id === product._id);
      if (existingItem) {
        return prevCart.map(item => 
          item._id === product._id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
    toast.success(`${product.name} added to cart!`); 
  };

  const updateQuantity = (id, delta) => {
    setCart((prevCart) => prevCart.map(item => {
      if (item._id === id) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item._id !== id));
    toast.error("Item removed from cart", { icon: '🗑️' });
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="bottom-right" toastOptions={{ duration: 3000, style: { borderRadius: '10px', background: '#333', color: '#fff' } }} />
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
          
          <AppRoutes 
            products={products}
            isLoading={isLoading}
            cart={cart}
            setCart={setCart}
            addToCart={addToCart}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            isCartOpen={isCartOpen}
            setIsCartOpen={setIsCartOpen}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            fetchProducts={fetchProducts}
          />

          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;