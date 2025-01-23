import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import DualLogo from '@/components/layout/DualLogo';
import RequestForm from '@/components/dashboard/RequestForm';
import Footer from '@/components/layout/Footer';

const CreateRequestPage = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const buttonVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    tap: { scale: 0.9 },
    hover: { scale: 1.1 },
  };

  const iconVariants = {
    initial: { opacity: 0, rotate: -30, scale: 0.5 },
    animate: { 
      opacity: 1, 
      rotate: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 200, damping: 10 }
    },
    exit: { 
      opacity: 0, 
      rotate: 30, 
      scale: 0.5,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-start min-h-screen bg-background p-4 md:p-8 relative"
    >
      {/* Enhanced Dark Mode Toggle Button */}
      <motion.div
        className="fixed top-4 right-4 md:top-6 md:right-6 z-50"
        initial="initial"
        animate="animate"
        whileTap="tap"
        whileHover="hover"
        variants={buttonVariants}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={toggleDarkMode}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-background/80 backdrop-blur-sm border-2 shadow-lg hover:shadow-xl transition-shadow duration-300 hover:border-primary"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isDarkMode ? 'dark' : 'light'}
              variants={iconVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 md:h-6 md:w-6 text-slate-700" />
              )}
            </motion.div>
          </AnimatePresence>
        </Button>
      </motion.div>

      <div className="w-full max-w-3xl">
        {/* Logo Section */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative flex justify-center items-center">
            <DualLogo size="large" />
          </div>
        </motion.div>

        {/* Title Section */}
        <motion.div
          className="flex justify-between items-center mb-8 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* <h1 className="text-2xl md:text-3xl font-bold">New Request</h1>
          <h1 className="text-2xl md:text-3xl font-bold" dir="rtl">طلب جديد</h1> */}
        </motion.div>

        {/* Form Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full"
        >
          <RequestForm isPublic={true} />

          <Footer/>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CreateRequestPage;