import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRequests } from '@/hooks/useRequests';
import { useAssignees } from '@/hooks/useAssignees';
import { useWebSocket } from '@/hooks/useWebSocket';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotification } from '@/contexts/NotificationContext';
import UserStatsChart from './UserStatsChart';
import {
  Save, Search, FileText, Clock, CheckCircle, AlertCircle,
  BarChart3, User, MessageSquare, IdCard, Folder, Loader, Wifi, WifiOff, RefreshCcw
} from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const Dashboard = () => {
  // Get state and actions from Zustand store
  const requests = useRequests(state => state.requests);
  const isLoading = useRequests(state => state.isLoading);
  const fetchRequests = useRequests(state => state.fetchRequests);
  const fetchStats = useRequests(state => state.fetchStats);
  const fetchUserStats = useAssignees(state => state.fetchStats);
  const updateRequest = useRequests(state => state.updateRequest);
  const remaining = useRequests(state => state.remaining);
  const { assignees, fetchAssignees } = useAssignees();
  const { showNotification } = useNotification();
  const { isConnected, addMessageListener } = useWebSocket();
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [showUserStats, setShowUserStats] = useState(false);
  const [userStats, setUserStats] = useState([]);
  const [skip, setSkip] = useState(0);

  // Initialize data
  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          fetchStats(),
          fetchRequests(),
          fetchAssignees()
        ]);
      } catch (err) {
        console.log(err)
        showNotification('Failed to initialize dashboard', 'error');
      }
    };
    init();
  }, []);

  // WebSocket message handler
  useEffect(() => {
    const handleMessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'new_request':
            handleNewRequest(message.data);
            break;
          case 'updated_request':
            handleUpdatedRequest(message.data);
            break;
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    const cleanup = addMessageListener(handleMessage);
    return () => cleanup();
  }, [addMessageListener]);

  const handleRefresh = async () => {
    try {
      setSkip(0);
      const [requestsData, statsData] = await Promise.all([
        fetchRequests({ skip: 0 }),
        fetchStats()
      ]);
      showNotification('Data refreshed successfully', 'success');
    } catch (error) {
      console.log(error)
      showNotification('Failed to refresh data', 'error');
    }
  };

  const handleLoadMore = async () => {
    try {
      const newSkip = requests.length;
      setSkip(newSkip);
      await fetchRequests({ skip: newSkip });
    } catch (error) {
      showNotification('Failed to load more requests', 'error');
    }
  };

  const convertUTCToLocal = (utcDate) => {
    if (!utcDate) return null;
    const date = new Date(utcDate);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  };

  const handleNewRequest = useCallback((newRequest) => {
    // Get current state
    const currentRequests = useRequests.getState().requests;
    newRequest.created_at = convertUTCToLocal(newRequest.created_at);
    // Check if request already exists
    if (!currentRequests.some(req => req.id === newRequest.id)) {
      // Update Zustand store
      useRequests.setState(state => ({
        requests: [newRequest, ...state.requests],
        totalRequest: state.totalRequest + 1,
        totalPending: state.totalPending + 1
      }));
      showNotification(`New request for ${newRequest.full_name}`, 'info');
    }
  }, [showNotification]);

  const handleUpdatedRequest = useCallback((updatedRequest) => {
    // Get current state
    const currentRequests = useRequests.getState().requests;
    updatedRequest.created_at = convertUTCToLocal(updatedRequest.created_at);
    // Update the request in the store
    useRequests.setState(state => {
      const newRequests = state.requests.map(req => {
        if (req.id === updatedRequest.id) {
          showNotification(`Request #${req.id} has been updated`, 'info');
          return { ...req, ...updatedRequest };
        }
        return req;
      });
      
      return {
        ...state,
        totalPending: state.totalPending - 1,
        totalCompleted: state.totalCompleted + 1,
        requests: statusFilter === 'pending' && updatedRequest.status !== 'pending'
          ? newRequests.filter(req => req.id !== updatedRequest.id)
          : newRequests
      };
    });
  }, [statusFilter, showNotification]);

  // Stats calculation
  const stats = useMemo(() => ({
    total: useRequests.getState().totalRequest,
    pending: useRequests.getState().totalPending,
    completed: useRequests.getState().totalCompleted,
  }), [requests]);

  // Memoize assignee options
  const assigneeOptions = useMemo(() => 
    assignees.map(assignee => ({
      value: assignee.id.toString(),
      label: assignee.full_name
    })),
    [assignees]
  );

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesSearch = request.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [requests, searchTerm, statusFilter]);

  const handleSaveRequest = async (requestId, updates) => {
    try {
      await updateRequest(requestId, updates);

      showNotification('Request updated successfully', 'success');
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Failed to update request', 'error');
    }
  };

  return (
    <div className="space-y-8">
      {/* Connection Status */}
      <div className="fixed bottom-4 right-4">
        <Badge 
          variant={isConnected ? "success" : "warning"}
          className="flex items-center gap-2"
        >
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4" />
              Connected
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4" />
              Reconnecting...
            </>
          )}
        </Badge>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage your requests</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setShowUserStats(!showUserStats)}
          >
            <BarChart3 className="h-4 w-4" />
            View Analytics
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Requests"
          value={stats.total}
          icon={FileText}
          description="All time requests"
        />
        <StatCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          variant="warning"
          description="Awaiting processing"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle}
          variant="success"
          description="Successfully processed"
        />
      </div>

      {/* Analytics Modal */}
      <UserStatsChart 
        isOpen={showUserStats}
        onClose={() => setShowUserStats(false)}
        data={userStats}
        fetchUserStats={fetchUserStats}
        useAssignees={useAssignees}
      />

      {/* Requests Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Requests
              <Badge variant="secondary" className="ml-2">
                {stats.pending} pending
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            <AnimatePresence>
              {isLoading && skip === 0 ? (
                <div className="flex justify-center p-8">
                  <Loader className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  No requests found
                </div>
              ) : (
                <>
                  {filteredRequests.map((request) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      onSave={handleSaveRequest}
                      assigneeOptions={assigneeOptions}
                    />
                  ))}
                  {remaining > 0 && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={isLoading}
                        className="flex items-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader className="h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            Load More ({remaining} remaining)
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
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

const RequestCard = ({ request, onSave, assigneeOptions }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    medical_number: request.medical_number || '',
    notes: request.notes || '',
    assigned_to: request.assignee?.id?.toString() || ''
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(request.id, formData);
    } finally {
      setIsSaving(false);
    }
  };

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
                <h3 className="text-lg font-semibold tracking-tight">{request.full_name}</h3>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <IdCard className="h-4 w-4" />
                  <span className="text-sm font-medium">{request.national_id}</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {new Date(request.created_at).toLocaleString("en-us")}
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4 bg-muted/30 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  Medical File Number
                </label>
                <Input
                  value={formData.medical_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, medical_number: e.target.value }))}
                  placeholder="Enter file number..."
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Assigned To
                </label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}
                >
                  <SelectTrigger className="bg-background">
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
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add notes..."
                className="bg-background"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default Dashboard;