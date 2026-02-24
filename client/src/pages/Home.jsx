import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Home = ({ products = [], addToCart, searchTerm }) => {
  const [index, setIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [unitCounts, setUnitCounts] = useState({});
  const words = ["Laptops", "Drones", "VR Gear", "Consoles", "Smart Home"];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const scrollToShop = () => {
    const shopSection = document.getElementById('shop-section');
    if (shopSection) {
      shopSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const safeProducts = Array.isArray(products) ? products : [];

  const categories = ["All", ...new Set(safeProducts.map(p => p.category))];

  const filteredProducts = safeProducts.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes((searchTerm || "").toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUnitChange = (id, delta) => {
    setUnitCounts(prev => {
      const current = prev[id] || 1;
      const newCount = current + delta;
      return { ...prev, [id]: newCount > 0 ? newCount : 1 };
    });
  };

  return (
    <div className="bg-[#050b14] min-h-screen text-white font-sans overflow-x-hidden">
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#050b14]/70 z-10" /> 
          <video 
            autoPlay loop muted playsInline 
            className="w-full h-full object-cover opacity-50"
          >
            <source src="https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="container mx-auto px-6 z-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center h-full">
          <div className="text-left pt-10">
            <motion.div 
              initial={{ opacity: 0, x: -50 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none mb-4 text-white drop-shadow-2xl">
                For you <br/> we have
              </h1>
              
              <div className="h-[120px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.span 
                    key={index} 
                    initial={{ y: 20, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }} 
                    exit={{ y: -20, opacity: 0 }} 
                    transition={{ duration: 0.4 }}
                    className="block text-6xl md:text-8xl font-black text-blue-500 drop-shadow-[0_0_35px_rgba(59,130,246,0.8)]"
                  >
                    {words[index]}
                  </motion.span>
                </AnimatePresence>
              </div>

              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-xl text-gray-300 max-w-lg leading-relaxed border-l-4 border-blue-600 pl-6 bg-black/40 p-4 rounded-r-xl backdrop-blur-md border border-white/10"
              >
                Premium gadgets delivered to your doorstep. Fill your cart and experience the future.
              </motion.p>

              <div className="mt-10">
                <button 
                  onClick={scrollToShop}
                  className="bg-white text-black px-10 py-4 rounded-full font-black text-xl hover:bg-blue-500 hover:text-white hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.4)]"
                >
                  Shop Now
                </button>
              </div>
            </motion.div>
          </div>

          <div className="hidden lg:flex justify-center items-center relative h-[600px] w-full">
            <div className="absolute w-[400px] h-[400px] bg-blue-600 rounded-full blur-[100px] opacity-60 animate-pulse mix-blend-screen" />

            <motion.div 
              className="absolute w-[550px] h-[550px] rounded-full border-[4px] border-t-blue-400 border-r-transparent border-b-blue-600 border-l-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              style={{ filter: "drop-shadow(0 0 20px #3b82f6)" }}
            />
             <motion.div 
              className="absolute w-[450px] h-[450px] rounded-full border-[2px] border-b-white border-t-transparent border-r-transparent border-l-transparent opacity-50"
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            />

            <motion.img 
               src="https://file.aiquickdraw.com/imgcompressed/img/compressed_a7034e1056dd5c8b6968d755161bac3a.webp" 
              alt="Future Tech"
              className="w-full max-w-xl object-contain relative z-10 drop-shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
              animate={{ y: [0, -30, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>
      </section>

      <div id="shop-section" className="relative z-30 bg-[#050b14] py-24 border-t border-white/10">
        <div className="container mx-auto px-6">
          
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 pb-6 border-b border-gray-800">
            <div>
               <p className="text-blue-500 font-bold uppercase tracking-[0.2em] mb-2">Inventory</p>
               <h2 className="text-5xl font-black text-white">Latest Drops</h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-12">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2 rounded-full font-bold transition-all ${
                  selectedCategory === cat 
                  ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
             <div className="text-center py-20 opacity-50">
               <h3 className="text-2xl font-bold">No products found.</h3>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredProducts.map(product => {
                const units = unitCounts[product._id] || 1;
                return (
                 <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  whileHover={{ y: -10 }}
                  key={product._id}
                  className="bg-[#111827] border border-gray-800 p-4 rounded-3xl group hover:border-blue-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300 flex flex-col"
                >
                  <div className="h-64 flex items-center justify-center mb-6 bg-[#050b14] rounded-2xl p-4 overflow-hidden">
                    <motion.img 
                      whileHover={{ scale: 1.15 }} transition={{ duration: 0.3 }}
                      src={product.image} alt={product.name} className="h-full object-contain drop-shadow-xl" 
                    />
                  </div>
                  
                  <div className="px-2 pb-2 flex-1 flex flex-col">
                    <p className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-2">{product.category}</p>
                    <h3 className="font-bold text-xl text-white mb-4 line-clamp-2">{product.name}</h3>
                    
                    <div className="mt-auto">
                      <span className="text-2xl font-black text-white block mb-4">₹{product.price}</span>
                      
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center bg-[#1e293b] rounded-full p-1 border border-gray-700">
                          <button onClick={() => handleUnitChange(product._id, -1)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition">-</button>
                          <span className="w-8 text-center font-bold text-sm">{units}</span>
                          <button onClick={() => handleUnitChange(product._id, 1)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition">+</button>
                        </div>

                        <button 
                          onClick={() => addToCart(product, units)} 
                          className="flex-1 bg-white text-black py-2 rounded-full font-bold text-sm hover:bg-blue-600 hover:text-white transition-all shadow-lg active:scale-95"
                        >
                          Add to Cart
                        </button>
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