import { useEffect, useState } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
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

function App() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');

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
    fetchProducts();
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
    
    // 🚀 We keep the toast notification, but we REMOVED the code that forces the cart open!
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

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAdmin');

    setToken(null);
    setIsAdmin(false);
    toast.success("Logged out successfully");
    window.location.href = "/";
  };

  return (
    <BrowserRouter>
      <Toaster position="bottom-right" toastOptions={{ duration: 3000, style: { borderRadius: '10px', background: '#333', color: '#fff' } }} />
      
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <Navbar 
          cart={cart} 
          removeFromCart={removeFromCart}
          updateQuantity={updateQuantity}
          isOpen={isCartOpen} 
          setIsOpen={setIsCartOpen}
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm}
          token={token} 
          isAdmin={isAdmin} 
          logout={logout}
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
          <Route path="/login" element={<Login setToken={setToken} setIsAdmin={setIsAdmin} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify" element={<VerifyOTP />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/wishlist" element={<Wishlist products={products} addToCart={addToCart} />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={token ? <Profile logout={logout} /> : <Navigate to="/login" />} />
          <Route path="/product/:id" element={<ProductDetails addToCart={addToCart} />} />
          <Route path="/add" element={isAdmin ? <AddProduct fetchProducts={fetchProducts} /> : <Navigate to="/" />} />
        </Routes>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;