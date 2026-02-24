import { motion } from 'framer-motion';

const CancelAnim = ({ onClose }) => {
  return (
    <div className="text-center p-10 flex flex-col items-center">
      <motion.div
        initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-200"
      >
        <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
          <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2, duration: 0.5 }} strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </motion.div>

      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-3xl font-black uppercase text-gray-900 mb-2">
        Order Cancelled
      </motion.h2>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-gray-500 mb-8 max-w-sm">
        Your order has been successfully revoked. Any charges will be refunded to your original payment method within 3-5 business days.
      </motion.p>

      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClose} className="bg-gray-200 text-gray-800 px-8 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all border border-gray-300 shadow-sm">
        Close Window
      </motion.button>
    </div>
  );
};

export default CancelAnim;