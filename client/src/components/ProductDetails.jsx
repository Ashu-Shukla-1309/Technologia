import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const ProductDetails = ({ addToCart }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🚀 REVIEW STATES
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
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
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('userEmail')?.split('@')[0] || "User";
    
    if (!token) return toast.error("Please login to review!");

    setIsSubmitting(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/products/${id}/reviews`, 
        { rating: newRating, comment: newComment, userName },
        { headers: { Authorization: `Bearer ${token}` } } // 🛡️ Secure Header added
      );
      toast.success("Review added! Thanks for your feedback.");
      setNewComment("");
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
    <div className="min-h-screen bg-slate-50 py-24 px-6 font-sans">
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
            
            {/* AGGREGATE RATING */}
            <div className="flex items-center gap-2 text-yellow-500 mb-6 font-bold">
              {"★".repeat(Math.round(product.rating || 0))}{"☆".repeat(5 - Math.round(product.rating || 0))}
              <span className="text-slate-400 text-sm ml-2">({product.numReviews} Global Reviews)</span>
            </div>

            <h2 className="text-4xl font-black text-slate-900 mb-8">₹{product.price.toLocaleString('en-IN')}</h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-10">{product.description || "Premium high-performance technology designed for the future."}</p>

            <button onClick={() => addToCart(product)} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-xl hover:bg-blue-700 transition shadow-xl shadow-blue-500/30">
              Add to Cart
            </button>
          </div>
        </motion.div>

        {/* 🚀 REVIEWS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mt-20 pt-20 border-t border-slate-200">
          <div className="lg:col-span-1">
            <h3 className="text-3xl font-black mb-6">Ratings & Reviews</h3>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
              <h4 className="font-bold mb-4">Leave your feedback</h4>
              <form onSubmit={handleReviewSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Stars</label>
                  <select value={newRating} onChange={(e) => setNewRating(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold">
                    {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Comment</label>
                  <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="How's the gear?" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl outline-none h-32 resize-none" required />
                </div>
                <button disabled={isSubmitting} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition disabled:opacity-50">
                  {isSubmitting ? "Posting..." : "Submit Review"}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <h3 className="text-3xl font-black mb-6">User Opinions</h3>
            {reviews.length === 0 ? (
              <div className="bg-white p-12 rounded-[2.5rem] text-center border border-dashed border-slate-300">
                <p className="text-slate-400 font-bold">No reviews yet. Be the first to break the ice!</p>
              </div>
            ) : (
              reviews.map((rev, i) => (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
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
    </div>
  );
};

export default ProductDetails;