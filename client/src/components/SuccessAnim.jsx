import { motion } from 'framer-motion';

const SuccessAnim = ({ onClose }) => {
  return (
    <div className="text-center p-10 flex flex-col items-center">
      {/* Animated Checkmark Circle */}
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.5)]"
      >
        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
          <motion.path 
            initial={{ pathLength: 0 }} 
            animate={{ pathLength: 1 }} 
            transition={{ delay: 0.2, duration: 0.5 }}
            strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" 
          />
        </svg>
      </motion.div>

      <motion.h2 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.3 }}
        className="text-3xl font-black uppercase text-white mb-2"
      >
        Order Confirmed!
      </motion.h2>

      <motion.p 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.5 }}
        className="text-gray-400 mb-8"
      >
        Your tech gear is being prepared for dispatch.
      </motion.p>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClose}
        className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-500 transition-all"
      >
        Continue Shopping
      </motion.button>
    </div>
  );
};

export default SuccessAnim;