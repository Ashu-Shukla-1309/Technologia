import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const ProductDetails = ({ addToCart }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [reviews, setReviews] = useState([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/products/${id}`);
      setProduct(res.data);
      setReviews(res.data.reviews || []);
    } catch (err) {
      toast.error("Product not found");
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const isLoggedIn = sessionStorage.getItem('userEmail');
    const userName = sessionStorage.getItem('userEmail')?.split('@')[0] || "User";
    
    if (!isLoggedIn) return toast.error("Please login to review!");
    
    if (!token) return toast.error("Please login to review!");
    if (!newComment.trim()) return toast.error("Please enter a comment.");

    setIsSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/products/${id}/reviews`, 
        { rating: newRating, comment: newComment, userName },
        { headers: { Authorization: `Bearer ${token}` } } 
      );
      toast.success("Review added! Thanks for your feedback.");
      setNewComment("");
      setNewRating(5);
      setIsReviewModalOpen(false); 
      fetchProduct(); 
    } catch (err) {
      toast.error(err.response?.data?.error || "Review submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!product) return null;

  return (
    <div className="min-h-screen bg-slate-50 py-24 px-6 font-sans relative">
      <div className="container mx-auto max-w-6xl">
        
        <button onClick={() => navigate(-1)} className="mb-8 font-bold text-slate-400 hover:text-slate-900 transition-colors flex items-center gap-2">
          &larr; Back to browsing
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row mb-16">
          <div className="md:w-1/2 p-16 bg-slate-50 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-100">
            <img src={product.image} className="w-full max-w-md object-contain mix-blend-multiply drop-shadow-2xl hover:scale-105 transition-transform duration-500" alt={product.name} />
          </div>

          <div className="md:w-1/2 p-12 md:p-16 flex flex-col justify-center">
            <span className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-4">{product.category}</span>
            <h1 className="text-5xl font-black text-slate-900 mb-6 leading-tight">{product.name}</h1>
            
            <div className="flex items-center gap-2 text-yellow-500 mb-6 font-bold">
              {"★".repeat(Math.round(product.rating || 0))}{"☆".repeat(5 - Math.round(product.rating || 0))}
              <span className="text-slate-400 text-sm ml-2">({product.numReviews} Global Reviews)</span>
            </div>

            <h2 className="text-4xl font-black text-slate-900 mb-8">₹{product.price.toLocaleString('en-IN')}</h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-10">{product.description || "Premium high-performance technology designed for the future."}</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
                <span className="text-2xl mb-2 block">🛡️</span>
                <p className="text-[10px] md:text-xs font-bold text-slate-600">Secure Checkout</p>
              </div>
              <div className="text-center p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
                <span className="text-2xl mb-2 block">📦</span>
                <p className="text-[10px] md:text-xs font-bold text-slate-600">Fast Delivery</p>
              </div>
              <div className="text-center p-4 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
                <span className="text-2xl mb-2 block">🔄</span>
                <p className="text-[10px] md:text-xs font-bold text-slate-600">Easy Returns</p>
              </div>
            </div>

            {/* SELLER IDENTITY CARD WITH VERIFIED AND UNVERIFIED BADGES */}
            {product.seller && (
              <div className="bg-white border border-slate-200 p-4 rounded-2xl mb-8 flex items-center gap-4 shadow-sm">
                 <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-black text-xl">
                   {product.seller.name ? product.seller.name.charAt(0).toUpperCase() : 'S'}
                 </div>
                 <div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Sold By</p>
                   <div className="flex items-center gap-2">
                     <p className="font-bold text-slate-900">{product.seller.name || "Anonymous Seller"}</p>
                     
                     {/* 🛡️ CONDITIONAL BADGE RENDER */}
                     {product.seller.isVerifiedSeller ? (
                       <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-green-200">
                         <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                         Verified
                       </span>
                     ) : (
                       <span className="bg-orange-50 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-orange-200">
                         <span className="text-orange-500">⚠️</span>
                         Unverified
                       </span>
                     )}
                   </div>
                   <p className="text-xs text-slate-500 mt-0.5">{product.seller.email}</p>
                 </div>
              </div>
            )}

            <button onClick={() => addToCart(product)} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-xl hover:bg-blue-700 transition shadow-xl shadow-blue-500/30">
              Add to Cart
            </button>
          </div>
        </motion.div>

        {/* REVIEWS SECTION */}
        <div className="mt-20 pt-10 border-t border-slate-200">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
            <h3 className="text-3xl font-black text-slate-900">User Opinions</h3>
            <button 
              onClick={() => setIsReviewModalOpen(true)} 
              className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold hover:bg-blue-600 transition shadow-md whitespace-nowrap"
            >
              ⭐ Write a Review
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviews.length === 0 ? (
              <div className="md:col-span-2 bg-white p-12 rounded-[2.5rem] text-center border border-dashed border-slate-300">
                <p className="text-slate-400 font-bold text-lg">No reviews yet. Be the first to break the ice!</p>
              </div>
            ) : (
              reviews.map((rev, i) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center font-bold text-blue-600 border border-blue-100">
                        {rev.userName.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-bold text-slate-900">{rev.userName}</p>
                    </div>
                    <div className="text-yellow-500 text-xs font-bold">
                      {"★".repeat(rev.rating)}{"☆".repeat(5-rev.rating)}
                    </div>
                  </div>
                  <p className="text-slate-500 leading-relaxed italic">"{rev.comment}"</p>
                  <p className="text-[10px] text-slate-300 mt-4 font-bold uppercase tracking-widest">{new Date(rev.date).toLocaleDateString()}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* REVIEW MODAL */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsReviewModalOpen(false)} 
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10 p-8 border border-gray-100"
            >
              <h2 className="text-2xl font-black text-gray-900 mb-2">Rate & Review</h2>
              <p className="text-gray-500 text-sm mb-6 font-medium line-clamp-1">{product.name}</p>
              
              <form onSubmit={handleReviewSubmit} className="space-y-6">
                
                <div>
                  <label className="block text-gray-700 font-bold mb-2 text-sm">Tap to Rate</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        type="button" 
                        key={star} 
                        onClick={() => setNewRating(star)} 
                        className={`text-4xl transition-colors hover:scale-110 focus:outline-none ${newRating >= star ? 'text-yellow-400' : 'text-gray-200'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-2 text-sm">Your Experience</label>
                  <textarea 
                    value={newComment} 
                    onChange={(e) => setNewComment(e.target.value)} 
                    placeholder="What did you love or hate about this product?" 
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-gray-900 outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm resize-none h-32"
                    required
                  />
                </div>

                <div className="flex gap-4 mt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsReviewModalOpen(false)} 
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-md shadow-blue-500/30 disabled:opacity-50"
                  >
                    {isSubmitting ? "Posting..." : "Post Review"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ProductDetails;