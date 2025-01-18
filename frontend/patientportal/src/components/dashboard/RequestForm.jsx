import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, User, CreditCard, Folder, Send, Loader2, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RequestSuccessDialog from '@/components/dashboard/RequestSuccessDialog';
import { useNotification } from '@/contexts/NotificationContext';
import { useRequests } from '@/hooks/useRequests';

const FormField = ({ labelEn, labelAr, id, icon: Icon, placeholder, value, onChange, required, maxLength }) => (
  <motion.div 
    whileHover={{ scale: 1.01 }} 
    className="space-y-8"
  >
    <div className="flex justify-between items-center mb-2">
      <Label htmlFor={id} className="flex items-center gap-2 text-base">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {labelEn} {required && <span className="text-red-500">*</span>}
      </Label>
      <Label htmlFor={id} className="flex items-center gap-2 text-base">
        {required && <span className="text-red-500">*</span>} {labelAr}
        <Icon className="h-4 w-4 text-muted-foreground" />
      </Label>
    </div>
    <Input
      id={id}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      maxLength={maxLength} 
      className="bg-background border-input text-center"
    />
  </motion.div>
);

const RequestForm = ({ isPublic }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    national_id: '',
    medical_number: '',
    notes: ''
  });
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { showNotification } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [requestNumber, setRequestNumber] = useState(null);
  const { createRequest } = useRequests();

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthorized(!!token);
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    let formattedValue = value;
    
    if (id === 'national_id' || id === 'medical_number') {
      formattedValue = value.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
                           .replace(/[^\d]/g, '');
    }
    
    setFormData(prev => ({
      ...prev,
      [id]: formattedValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.national_id) {
      showNotification("All fields are required. / جميع الحقول مطلوبة", "error");
      return;
    }
  
    if (formData.national_id.length !== 10) {
      showNotification(
        "National/Iqama ID must be exactly 10 digits.  يجب أن يكون رقم الهوية الوطنية / الإقامة 10 أرقام بالضبط",
        "error"
      );
      return;
    }

    if (!isAuthorized){
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
    }
    setIsSubmitting(true);
    
    try {
      const payload = {
        full_name: formData.full_name,
        national_id: parseInt(formData.national_id),
        medical_number: formData.medical_number ? parseInt(formData.medical_number) : null,
        notes: formData.notes,
        is_guest: isPublic
      };
      
      const response = await createRequest(payload);
      
      setRequestNumber(response.number); 
      
      setFormData({
        full_name: '',
        national_id: '',
        medical_number: '',
        notes: ''
      });
      
      setShowSuccessDialog(true);
      // showNotification("Request submitted successfully. / تم تقديم الطلب بنجاح", 'success');
    } catch (error) {
      console.error('Submission error:', error);
      showNotification(
        error.response?.data?.detail || "Failed to submit request. Please try again. / فشل تقديم الطلب. يرجى المحاولة مرة أخرى.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <Card className="w-full shadow-lg flex-1">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField 
              labelEn="Full Name"
              labelAr="الاسم الكامل"
              id="full_name"
              icon={User}
              placeholder="أدخل الاسم الكامل"
              value={formData.full_name}
              onChange={handleInputChange}
              required
            />
            
            <FormField 
              labelEn="National / Iqama ID"
              labelAr="رقم الهوية الوطنية / الإقامة"
              id="national_id"
              icon={CreditCard}
              maxLength={10}
              placeholder="أدخل رقم الهوية / الإقامة"
              value={formData.national_id}
              onChange={handleInputChange}
              required
            />
            
            <FormField 
              labelEn="Medical File Number"
              labelAr="رقم الملف الطبي"
              id="medical_number"
              icon={Folder}
              placeholder=" أدخل رقم الملف الطبي"
              value={formData.medical_number}
              onChange={handleInputChange}
            />
            {!isPublic && (
            <FormField 
            labelEn="Notes"
            labelAr="ملاحظات"
            id="notes"
            icon={FileText}
            placeholder="ادخل الملاحظات"
            value={formData.notes}
            onChange={handleInputChange}
          />
            )}

            
            <motion.div 
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }} 
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            >
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2 py-6 text-lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing... / جاري المعالجة...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Submit Request / تقديم الطلب</span>
                  </>
                )}
              </Button>
            </motion.div>
          </form>
        </CardContent>
      </Card>

      {!isAuthorized && (
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
                Karim Yahia Alanizy
              </span>
            </div>
            <motion.div 
              className="flex items-center justify-center gap-2 text-muted-foreground/60 hover:text-primary transition-colors"
              whileHover={{ scale: 1.01 }}
            >
              <Mail className="h-4 w-4" />
              <a 
                href="mailto:kalanizy@hotmail.com"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                kalanizy@hotmail.com
              </a>
            </motion.div>
          </motion.div>
        </footer>
      )}
      <RequestSuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        requestNumber={requestNumber}
      />
    </div>
  );
};

export default RequestForm;