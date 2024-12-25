import React from 'react';
import { motion } from 'framer-motion';
import { FileText, User, CreditCard, MessageSquare, Send } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const RequestForm = () => {
  const availableUsers = ["John Doe", "Jane Smith", "Bob Johnson"];
  
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
        <form className="space-y-6">
          <FormField 
            label="Full Name" 
            id="dashboardName" 
            icon={<User className="text-muted-foreground" />}
            placeholder="Enter full name"
          />
          <FormField 
            label="National ID" 
            id="dashboardNationalId" 
            icon={<CreditCard className="text-muted-foreground" />}
            placeholder="Enter national ID"
          />
          <FormField 
            label="Notes" 
            id="notes" 
            icon={<MessageSquare className="text-muted-foreground" />}
            placeholder="Add any additional notes"
          />
          <UserSelect users={availableUsers} />
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
};

const FormField = ({ label, id, icon, placeholder }) => (
  <motion.div whileHover={{ scale: 1.01 }} className="space-y-2">
    <Label htmlFor={id} className="flex items-center gap-2">
      {icon}
      {label}
    </Label>
    <Input 
      id={id} 
      placeholder={placeholder}
      className="bg-background border-input"
    />
  </motion.div>
);

const UserSelect = ({ users }) => (
  <motion.div whileHover={{ scale: 1.01 }} className="space-y-2">
    <Label className="flex items-center gap-2">
      <User className="text-muted-foreground" />
      Assigned To
    </Label>
    <Select>
      <SelectTrigger className="bg-background border-input">
        <SelectValue placeholder="Select user" />
      </SelectTrigger>
      <SelectContent>
        {users.map(user => (
          <SelectItem key={user} value={user}>{user}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </motion.div>
);

const SubmitButton = () => (
  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
    <Button 
      type="submit" 
      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
    >
      <Send className="h-4 w-4" />
      Process Request
    </Button>
  </motion.div>
);

export default RequestForm;