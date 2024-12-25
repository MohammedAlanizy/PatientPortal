import React, { useState, useMemo } from 'react';
import { useRequests } from '@/hooks/useRequests';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AnalyticsView from './TimelineChart';
import {
  Save,
  Search,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  User,
  MessageSquare,
  IdCard,
  Folder,
  CheckCheck
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Dashboard = () => {
  const { requests, saveRequest, updateRequest } = useRequests();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('waiting');
  const [showAnalytics, setShowAnalytics] = useState(false);

  const stats = useMemo(() => ({
    total: requests.length,
    waiting: requests.filter(r => r.status === 'waiting').length,
    completed: requests.filter(r => r.status === 'completed').length
  }), [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesSearch = request.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [requests, searchTerm, statusFilter]);



  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage your requests</p>
        </div>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
          onClick={() => setShowAnalytics(true)}
        >
          <BarChart3 className="h-4 w-4" />
          View Analytics
        </Button>
      </div>
      {showAnalytics && (
        <AnalyticsView 
            data={requests} 
            onClose={() => setShowAnalytics(false)} 
        />
        )}
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Requests"
          value={stats.total}
          icon={FileText}
          description="All time requests"
        />
        <StatCard
          title="Waiting"
          value={stats.waiting}
          icon={Clock}
          variant="warning"
          description="Pending approval"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle}
          variant="success"
          description="Successfully processed"
        />
      </div>

      {/* Incoming Requests Section - Now Full Width */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Incoming Requests
              <Badge variant="secondary" className="ml-2">
                {stats.waiting} new
              </Badge>
            </CardTitle>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            <AnimatePresence>
              {filteredRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onSave={saveRequest}
                  onUpdate={updateRequest}
                />
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, variant = 'default', description }) => {
  const variants = {
    default: 'bg-primary/10 text-primary',
    warning: 'bg-yellow-500/10 text-yellow-500',
    success: 'bg-green-500/10 text-green-500',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold">{value}</h3>
              <span className="text-sm text-muted-foreground">{description}</span>
            </div>
          </div>
          <div className={`p-3 rounded-lg ${variants[variant]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const RequestCard = ({ request, onSave, onUpdate }) => {
    const [isSaving, setIsSaving] = useState(false);
    
    const handleSave = async () => {
      setIsSaving(true);
      await onSave(request);
      setTimeout(() => setIsSaving(false), 1000);
    };
  
    const assigneeOptions = [
      { value: "john.doe", label: "John Doe" },
      { value: "jane.smith", label: "Jane Smith" },
      { value: "mike.brown", label: "Mike Brown" }
    ];
  
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        layout
        className="group"
      >
        <Card className="overflow-hidden border bg-card hover:bg-accent/5 transition-colors">
          <div className="p-6 space-y-6">
            {/* Header with User Info */}
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold tracking-tight">{request.fullName}</h3>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <IdCard className="h-4 w-4" />
                    <span className="text-sm font-medium">{request.nationalId}</span>
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {new Date(request.timestamp).toLocaleString('en-US', {
                  hour: 'numeric',
                  minute: 'numeric',
                  hour12: true,
                  month: 'short',
                  day: 'numeric'
                })}
              </div>
            </div>
  
            {/* Editable Fields Section */}
            <div className="space-y-4 bg-muted/30 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    Medical File Number (Optional)
                  </label>
                  <Input
                    value={request.fileId || ''}
                    onChange={(e) => onUpdate(request.id, { fileId: e.target.value })}
                    placeholder="Enter file ID..."
                    className="bg-background"
                  />
                </div>
  
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Assigned To
                  </label>
                  <Select
                    value={request.assignedTo}
                    onValueChange={(value) => onUpdate(request.id, { assignedTo: value })}
                  >
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {assigneeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
  
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Notes
                </label>
                <Input
                  value={request.notes || ''}
                  onChange={(e) => onUpdate(request.id, { notes: e.target.value })}
                  placeholder="Add notes..."
                  className="bg-background"
                />
              </div>
            </div>
  
            {/* Save Button */}
            <div className="flex justify-end">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleSave}
                  className={`
                    ${isSaving ? 'bg-green-500 hover:bg-green-600' : 'bg-primary hover:bg-primary/90'}
                    text-primary-foreground transition-all duration-300
                  `}
                  disabled={isSaving}
                >
                  <motion.div
                    className="flex items-center gap-2"
                    initial={false}
                    animate={{
                      opacity: [1, 1],
                      transition: { duration: 0.2 }
                    }}
                  >
                    {isSaving ? (
                      <>
                        <CheckCheck className="h-4 w-4" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </motion.div>
                </Button>
              </motion.div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
};
export default Dashboard;