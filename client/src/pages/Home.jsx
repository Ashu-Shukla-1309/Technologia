import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom'; // 🚀 NEW: Imported Link for navigation

const Home = ({ products = [], isLoading, addToCart, searchTerm }) => {
  const [index, setIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [unitCounts, setUnitCounts] = useState({});
  const [expandedId, setExpandedId] = useState(null); 
  
  const [sortOrder, setSortOrder] = useState("default");
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem('technologia_wishlist');
    return saved ? JSON.parse(saved) : [];
  });
  
  const words = ["Laptops", "Drones", "VR Gear", "Consoles", "Smart Home"];

  const bannerImages = [
    "https://pngimg.com/uploads/macbook/macbook_PNG65.png",                                
    "https://pngimg.com/uploads/drone/drone_PNG204.png",                                  
    "https://file.aiquickdraw.com/imgcompressed/img/compressed_5733db2c0bdb304c4f8c5863b04e3c4c.webp",
    "https://pngimg.com/uploads/gamepad/gamepad_PNG62.png",                                
    "https://m.media-amazon.com/images/I/61fB9i7y81L.png"                
  ];

  useEffect(() => {
    const masterTimer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 3500); 
    return () => clearInterval(masterTimer);
  }, [words.length]);

  const scrollToShop = () => {
    const shopSection = document.getElementById('shop-section');
    if (shopSection) shopSection.scrollIntoView({ behavior: 'smooth' });
  };

  // 🚀 WISHLIST TOGGLE LOGIC
  const toggleWishlist = (id) => {
    let updatedWishlist;
    if (wishlist.includes(id)) {
      updatedWishlist = wishlist.filter(itemId => itemId !== id);
      toast("Removed from wishlist", { icon: '💔' });
    } else {
      updatedWishlist = [...wishlist, id];
      toast.success("Added to wishlist!", { icon: '❤️' });
    }
    setWishlist(updatedWishlist);
    localStorage.setItem('technologia_wishlist', JSON.stringify(updatedWishlist));
  };

  const safeProducts = Array.isArray(products) ? products : [];
  const categories = ["All", ...new Set(safeProducts.map(p => p.category))];

  // 🚀 FILTERING AND SORTING LOGIC
  let displayProducts = safeProducts.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes((searchTerm || "").toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (sortOrder === "low-high") {
    displayProducts.sort((a, b) => a.price - b.price);
  } else if (sortOrder === "high-low") {
    displayProducts.sort((a, b) => b.price - a.price);
  }

  const handleUnitChange = (id, delta) => {
    setUnitCounts(prev => {
      const current = prev[id] || 1;
      const newCount = current + delta;
      return { ...prev, [id]: newCount > 0 ? newCount : 1 };
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen text-gray-900 font-sans overflow-x-hidden">
      
      {/* 🚀 COMPACT HERO SECTION */}
      <section className="relative h-[500px] md:h-[700px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-950">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div animate={{ scale: [1, 1.2, 1], x: [0, 80, 0], y: [0, -40, 0] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[-10%] left-[-10%] w-[10000px] h-[1000px] bg-blue-500/30 blur-[100px] rounded-full" />
          <motion.div animate={{ scale: [1.2, 1, 1.2], x: [0, -80, 0], y: [0, 80, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-400/20 blur-[100px] rounded-full" />
        </div>
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        
        <div className="container mx-auto px-6 z-20 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center h-full">
          <div className="text-left">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              {/* Reduced font sizes for compact look */}
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight mb-2 text-white drop-shadow-lg">For you <br/> we have</h1>
              <div className="h-[80px] md:h-[100px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.span key={index} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ duration: 0.4 }} className="block text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200 drop-shadow-md">
                    {words[index]}
                  </motion.span>
                </AnimatePresence>
              </div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-4 text-lg text-blue-100 max-w-md leading-relaxed border-l-4 border-cyan-400 pl-6 bg-white/10 backdrop-blur-md p-3 rounded-r-2xl shadow-xl border border-white/20">
                Premium gadgets delivered to your doorstep.
              </motion.p>
              <div className="mt-8">
                <button onClick={scrollToShop} className="bg-white text-blue-900 px-8 py-3 rounded-full font-black text-lg hover:bg-cyan-50 hover:scale-105 transition-all shadow-xl">Shop Now</button>
              </div>
            </motion.div>
          </div>

          <div className="hidden lg:flex justify-center items-center relative h-[400px] w-full">
            <div className="absolute w-[350px] h-[350px] bg-blue-300/10 blur-[50px] rounded-full z-0" />
            <motion.div className="relative z-20 w-full max-w-md flex justify-center items-center h-[350px]">
              <AnimatePresence mode="wait">
                <motion.img key={index} src={bannerImages[index]} alt={words[index]} className="absolute w-[100%] h-[100%] object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)]" initial={{ opacity: 0, x: 80, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1.1 }} exit={{ opacity: 0, x: -80, scale: 0.9 }} transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}/>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 🚀 2. THE DISTINCT WHITE CARDS SECTION */}
      <div id="shop-section" className="relative z-30 bg-slate-100 py-20 border-t border-slate-200 shadow-[inset_0_10px_30px_rgba(0,0,0,0.02)]">
        <div className="container mx-auto px-6">
          
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 pb-6 border-b border-slate-200">
            <div>
               <p className="text-blue-600 font-bold uppercase tracking-[0.2em] mb-2 drop-shadow-sm">Inventory</p>
               <h2 className="text-5xl font-black text-gray-900">Latest Drops</h2>
            </div>
            
            <div className="mt-6 md:mt-0">
              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-white border border-slate-300 text-slate-700 font-bold py-3 px-6 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                <option value="default">Sort by: Default</option>
                <option value="low-high">Price: Low to High</option>
                <option value="high-low">Price: High to Low</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-12">
            {categories.map(cat => (
              <button 
                key={cat} onClick={() => setSelectedCategory(cat)}
                className={`px-8 py-3 rounded-full font-bold transition-all shadow-sm ${
                  selectedCategory === cat 
                  ? "bg-gray-900 text-white shadow-lg scale-105" 
                  : "bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white p-5 rounded-[2rem] shadow-sm flex flex-col h-[420px] border border-slate-100">
                  <div className="h-64 bg-slate-200 rounded-2xl mb-6"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-auto"></div>
                  <div className="h-10 bg-slate-200 rounded-2xl w-full mt-4"></div>
                </div>
              ))}
            </div>
          ) : displayProducts.length === 0 ? (
              <div className="text-center py-20 opacity-50"><h3 className="text-2xl font-bold">No products found.</h3></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {displayProducts.map(product => {
                const units = unitCounts[product._id] || 1;
                const isStocked = product.inStock !== false;
                const isWishlisted = wishlist.includes(product._id);

                return (
                 <motion.div
                  initial={{ opacity: 0, y: 30 }} 
                  whileInView={{ opacity: 1, y: 0 }} 
                  viewport={{ once: true, margin: "-50px" }} 
                  whileHover={{ y: -8 }}
                  key={product._id}
                  className="bg-white p-5 rounded-[2rem] shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col border border-white/60 relative"
                 >
                  <button 
                    onClick={() => toggleWishlist(product._id)}
                    className="absolute top-8 right-8 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm hover:scale-110 transition-transform"
                  >
                    {isWishlisted ? '❤️' : '🤍'}
                  </button>

                  {/* 🚀 NEW: Clickable Image wrapping Link */}
                  <Link to={`/product/${product._id}`} className="block h-64 flex items-center justify-center mb-6 bg-slate-50 rounded-2xl p-4 overflow-hidden border border-slate-100 group relative">
                    <motion.img 
                      whileHover={{ scale: 1.1 }} 
                      transition={{ duration: 0.4 }} 
                      src={product.image} 
                      alt={product.name} 
                      className={`h-full object-contain mix-blend-multiply drop-shadow-md group-hover:drop-shadow-xl transition-all ${!isStocked && 'opacity-50 grayscale'}`} 
                    />
                  </Link>
                  
                  <div className="px-2 pb-2 flex-1 flex flex-col">
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-2">{product.category}</p>
                    
                    {/* 🚀 NEW: Clickable Title wrapping Link */}
                    <Link to={`/product/${product._id}`}>
                      <h3 className="font-bold text-xl text-gray-900 mb-1 line-clamp-2 leading-tight hover:text-blue-600 transition-colors">{product.name}</h3>
                    </Link>
                    
                    <button 
                      onClick={() => setExpandedId(expandedId === product._id ? null : product._id)}
                      className="text-sm text-blue-600 font-semibold hover:underline text-left mb-4 w-max"
                    >
                      {expandedId === product._id ? "Show less" : "Know more"}
                    </button>

                    <AnimatePresence>
                      {expandedId === product._id && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-sm text-gray-600 mb-4 overflow-hidden"
                        >
                          {product.description || "Experience the next level of technology with this premium device, engineered for ultimate performance and reliability."}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="mt-auto">
                      <span className="text-3xl font-black text-gray-900 block mb-6 tracking-tight">₹{product.price}</span>
                      
                      <div className="flex justify-between items-center gap-3">
                        <div className="flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200">
                          <button onClick={() => handleUnitChange(product._id, -1)} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-sm transition font-bold text-lg">-</button>
                          <span className="w-8 text-center font-black text-sm">{units}</span>
                          <button onClick={() => handleUnitChange(product._id, 1)} className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-700 hover:bg-white hover:shadow-sm transition font-bold text-lg">+</button>
                        </div>

                        {isStocked ? (
                          <button onClick={() => addToCart(product, units)} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg hover:shadow-blue-500/30 active:scale-95">
                            Add to Cart
                          </button>
                        ) : (
                          <button disabled className="flex-1 bg-gray-300 text-gray-500 py-3 rounded-2xl font-bold text-sm cursor-not-allowed">
                            Out of Stock
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                 </motion.div>
                )})}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;