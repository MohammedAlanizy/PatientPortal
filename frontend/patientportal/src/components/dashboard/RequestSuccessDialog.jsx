import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const RequestSuccessDialog = ({ isOpen, onClose, requestNumber }) => {
  const navigate = useNavigate();

  const handleViewCounter = () => {
    navigate('/counter?is_guest=True', { state: { requestNumber: requestNumber } });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mx-auto mb-4"
          >
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </motion.div>
          
          <DialogTitle className="text-xl sm:text-2xl font-semibold text-center space-y-2">
            <div>Request Submitted Successfully</div>
            <div>تم تقديم الطلب بنجاح</div>
          </DialogTitle>
          
          <DialogDescription className="text-center mt-4 space-y-2">
            <div className="text-muted-foreground">
              <p>Your request has been received and is being processed.</p>
              <p>تم استلام طلبك وجاري معالجته</p>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-muted p-4 rounded-lg mt-4"
            >
              <div className="space-y-1">
                <div className="text-lg font-medium">
                  <p>Your Request Number</p>
                  <p>رقم طلبك</p>
                </div>
                <p className="text-3xl font-bold text-primary" dir="ltr">
                  {requestNumber}
                </p>
              </div>
            </motion.div>
            
            <div className="text-sm text-muted-foreground mt-2">
              <p>Please save this number until they call you using this number.</p>
              <p>يرجى حفظ هذا الرقم حتى يتم النداء عليك باستخدامه.</p>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        {/* Only modified section - buttons container */}
        <div className="flex flex-col gap-3 mt-4">
          <Button 
            onClick={handleViewCounter} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-900 dark:hover:bg-emerald-800 dark:text-white"
          >
            View Current Number / متابعة الرقم الحالي
          </Button>
          
          <Button 
            onClick={onClose} 
            className="w-full"
          >
            Close / إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestSuccessDialog;