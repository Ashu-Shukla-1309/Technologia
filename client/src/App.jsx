import { useEffect, useState } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');

  const fetchProducts = () => {
    axios.get('${import.meta.env.VITE_API_URL}/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error("Fetch Error:", err));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Updated to handle quantity
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
    setIsCartOpen(true);
  };

  // Function to update quantity from inside the cart
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
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setIsAdmin(false);
    window.location.href = "/";
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#050b14] flex flex-col font-sans">
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
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={token ? <Profile logout={logout} /> : <Navigate to="/login" />} />
          <Route path="/add" element={isAdmin ? <AddProduct fetchProducts={fetchProducts} /> : <Navigate to="/" />} />
        </Routes>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;