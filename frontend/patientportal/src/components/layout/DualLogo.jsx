import React from 'react';
import { motion } from 'framer-motion';

const DualLogo = ({ className = "", size = "default" }) => {
  const sizeClasses = {
    default: "h-10",
    large: "h-16",
    small: "h-8"
  };

  return (
    <motion.div 
      className={`flex items-center justify-center gap-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <img
          src="/logo.png"
          alt="Ministry of Health"
          className={`${sizeClasses[size]} w-auto drop-shadow-xl`}
        />
      </motion.div>
      <div className="h-8 w-px bg-border/60" />
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <img
          src="/logo2.png"
          alt="Secondary Logo"
          className={`${sizeClasses[size]} w-auto drop-shadow-xl`}
        />
      </motion.div>
    </motion.div>
  );
};

export default DualLogo;