import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import DualLogo from '@/components/layout/DualLogo';

const ThankYouPage = () => {

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-background/80">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <DualLogo size="large" />
      </motion.div>

      {/* Thank You Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-2xl"
      >
        <Card className="bg-background/40 backdrop-blur-xl border-2 shadow-xl">
          <CardContent className="p-8 md:p-12 flex flex-col items-center">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.4 
              }}
              className="mb-6"
            >
              <div className="rounded-full bg-primary/10 p-4">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
            </motion.div>

            {/* Thank You Messages */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center space-y-6 mb-8"
            >
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold text-primary">Thank You!</h1>
                <h2 className="text-2xl md:text-3xl font-bold text-primary">!شكراً لك</h2>
              </div>
              
              <div className="space-y-2 text-muted-foreground">
                <p className="text-lg">Your request has been processed successfully.</p>
                <p className="text-lg">تم معالجة طلبك بنجاح</p>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ThankYouPage;