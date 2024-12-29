import React from 'react';
import { motion } from 'framer-motion';

const UsernameDisplay = ({ username = "User" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center"
    >
      <div className="rounded-md px-3 py-1.5 bg-primary/10 text-primary">
        <span className="text-sm font-medium">
          {username}
        </span>
      </div>
    </motion.div>
  );
};

export default UsernameDisplay;