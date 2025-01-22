import React from 'react';
import { motion } from 'framer-motion';
import { User,  Mail } from 'lucide-react';


const Footer = () => {


  return (
        <footer className="w-full mt-8">
        <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center space-y-2 py-4 border-t border-border/40"
        >
        <div className="flex items-center justify-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground/60" />
            <span className="text-sm text-muted-foreground/60">
            Developed and designed by
            </span>
            <span className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                {import.meta.env.VITE_AUTHOR_NAME}
            </span>
        </div>
        <motion.div 
            className="flex items-center justify-center gap-2 text-muted-foreground/60 hover:text-primary transition-colors"
            whileHover={{ scale: 1.01 }}
        >
            <Mail className="h-4 w-4" />
            <a 
            href={`mailto:${import.meta.env.VITE_AUTHOR_EMAIL}`}
            className="text-sm font-medium transition-colors hover:text-primary"
            >
            {import.meta.env.VITE_AUTHOR_EMAIL}
            </a>
        </motion.div>
        </motion.div>
        </footer>
  );
};

export default Footer;