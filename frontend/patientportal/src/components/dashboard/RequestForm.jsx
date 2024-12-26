import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, User, CreditCard, Folder, Send, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNotification } from '@/contexts/NotificationContext';
import { useRequests } from '@/hooks/useRequests';

const RequestForm = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    national_id: '',
    medical_number: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createRequest } = useRequests();
  const { showNotification } = useNotification();

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
      showNotification("Please fill in all required fields", "error");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const payload = {
        full_name: formData.full_name,
        national_id: parseInt(formData.national_id),
        medical_number: formData.medical_number ? parseInt(formData.medical_number) : null
      };
      
      const response = await createRequest(payload);
      console.log('Request created:', response);
      
      setFormData({
        full_name: '',
        national_id: '',
        medical_number: ''
      });
      
      showNotification("Your request has been successfully processed", "success");
      
    } catch (error) {
      console.error('Submission error:', error);
      showNotification(
        error.response?.data?.detail || "Failed to save request",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <FileText className="text-primary h-6 w-6" />
          New Request
        </CardTitle>
        <CardDescription>Create and process a new request</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField 
            label="Full Name" 
            id="full_name" 
            icon={<User className="text-muted-foreground" />}
            placeholder="Enter full name"
            value={formData.full_name}
            onChange={handleInputChange}
            required
          />
          <FormField 
            label="National ID" 
            id="national_id" 
            icon={<CreditCard className="text-muted-foreground" />}
            placeholder="Enter national ID"
            value={formData.national_id}
            onChange={handleInputChange}
            required
          />
          <FormField 
            label="Medical File Number (Optional)" 
            id="medical_number" 
            icon={<Folder className="text-muted-foreground" />}
            placeholder="Enter Medical File Number"
            value={formData.medical_number}
            onChange={handleInputChange}
          />
          <SubmitButton isSubmitting={isSubmitting} />
        </form>
      </CardContent>
    </Card>
  );
};

const FormField = ({ label, id, icon, placeholder, value, onChange, required }) => (
  <motion.div whileHover={{ scale: 1.01 }} className="space-y-2">
    <Label htmlFor={id} className="flex items-center gap-2">
      {icon}
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    <Input 
      id={id} 
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      className="bg-background border-input"
    />
  </motion.div>
);

const SubmitButton = ({ isSubmitting }) => (
  <motion.div whileHover={{ scale: isSubmitting ? 1 : 1.02 }} whileTap={{ scale: isSubmitting ? 1 : 0.98 }}>
    <Button 
      type="submit" 
      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Send className="h-4 w-4" />
      )}
      {isSubmitting ? 'Processing...' : 'Process Request'}
    </Button>
  </motion.div>
);

export default RequestForm;