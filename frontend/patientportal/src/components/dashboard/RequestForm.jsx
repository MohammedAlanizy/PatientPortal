import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, User, CreditCard, Folder, Send, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNotification } from '@/contexts/NotificationContext';
import { useRequests } from '@/hooks/useRequests';

const FormField = ({ labelEn, labelAr, id, icon: Icon, placeholder, value, onChange, required }) => (
  <motion.div 
    whileHover={{ scale: 1.01 }} 
    className="space-y-2"
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
      className="bg-background border-input text-center"
    />
  </motion.div>
);

const RequestForm = ({ isPublic }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    national_id: '',
    medical_number: '',
  });
  const { showNotification } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createRequest } = useRequests();
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
      return;
    }

    setIsSubmitting(true);
    
    try {
      const payload = {
        full_name: formData.full_name,
        national_id: parseInt(formData.national_id),
        medical_number: formData.medical_number ? parseInt(formData.medical_number) : null,
        is_guest: isPublic
      };
      
      await createRequest(payload);
      
      setFormData({
        full_name: '',
        national_id: '',
        medical_number: ''
      });
      
      showNotification("Request submitted successfully. / تم تقديم الطلب بنجاح", 'success');

      
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
    <Card className="w-full shadow-lg">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField 
            labelEn="Full Name"
            labelAr="الاسم الكامل"
            id="full_name"
            icon={User}
            placeholder="Enter full name / أدخل الاسم الكامل"
            value={formData.full_name}
            onChange={handleInputChange}
            required
          />
          
          <FormField 
            labelEn="National ID"
            labelAr="رقم الهوية الوطنية"
            id="national_id"
            icon={CreditCard}
            placeholder="Enter national ID / أدخل رقم الهوية"
            value={formData.national_id}
            onChange={handleInputChange}
            required
          />
          
          <FormField 
            labelEn="Medical File Number"
            labelAr="رقم الملف الطبي"
            id="medical_number"
            icon={Folder}
            placeholder="Enter medical file number / أدخل رقم الملف الطبي"
            value={formData.medical_number}
            onChange={handleInputChange}
          />
          
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
  );
};

export default RequestForm;