import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useNotification } from '@/contexts/NotificationContext';
import { useAssignees } from '@/hooks/useAssignees';
import { useRequests } from '@/hooks/useRequests';
import { useWebSocket } from '@/hooks/useWebSocket';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  ChevronDown,
  Clock,
  FileText,
  Folder,
  IdCard,
  Loader,
  MessageSquare,
  RefreshCcw,
  Save,
  Search,
  User,
  Wifi,
  WifiOff
} from 'lucide-react';
import UserStatsChart from './UserStatsChart';

const Dashboard = () => {
  // Store state
  const requests = useRequests(state => state.requests);
  const isLoading = useRequests(state => state.isLoading);
  const isRefreshing = useRequests(state => state.isRefreshing);
  const fetchRequests = useRequests(state => state.fetchRequests);
  const fetchStats = useRequests(state => state.fetchStats);
  const fetchUserStats = useAssignees(state => state.fetchStats);
  const updateRequest = useRequests(state => state.updateRequest);
  const remaining = useRequests(state => state.remaining);
  const { assignees, fetchAssignees } = useAssignees();
  const { showNotification } = useNotification();
  const { isConnected, addMessageListener, connect } = useWebSocket();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [showUserStats, setShowUserStats] = useState(false);
  const [userStats, setUserStats] = useState([]);
  const [skip, setSkip] = useState(0);
  const [expandedCards, setExpandedCards] = useState(() => new Set());
  const [isInitialized, setIsInitialized] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Refs for intervals
  const pollingIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Initialize data and establish WebSocket connection
  useEffect(() => {
    const initializeDashboard = async () => {
      if (isInitialized) return;

      try {
        // Connect WebSocket first
        connect();

        // Fetch initial data in parallel
        await Promise.all([
          fetchStats(),
          fetchAssignees(),
          fetchRequests({ skip: 0, order_by: '-created_at, -updated_at', status: statusFilter, limit: 30 })
        ]);

        setIsInitialized(true);
      } catch (err) {
        console.error('Dashboard initialization error:', err);
        showNotification('Failed to initialize dashboard', 'error');
      }
    };

    initializeDashboard();
  }, [connect, fetchStats, fetchAssignees, fetchRequests, statusFilter, isInitialized]);

  // Function to start polling with countdown
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    
    pollingIntervalRef.current = setInterval(async () => {
      try {
        await Promise.all([
          fetchRequests({ skip: 0, order_by: '-created_at, -updated_at', status: statusFilter, limit: 30 }, true),
          fetchStats()
        ]);
        setCountdown(5);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 5));
      connect();
    }, 1000);
  }, [fetchRequests, fetchStats, statusFilter, connect]);

  // Function to stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Effect to manage polling based on WebSocket connection
  useEffect(() => {
    if (!isConnected) {
      console.log('WebSocket disconnected, starting polling...');
      startPolling();
    } else {
      console.log('WebSocket connected, stopping polling...');
      stopPolling();
    }

    return () => stopPolling();
  }, [isConnected, startPolling, stopPolling]);

  // WebSocket message handler
  useEffect(() => {
    const handleMessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'new_request':
            useRequests.getState().handleWebSocketUpdate(message.data, message.type);
            setExpandedCards(prev => new Set([...prev, message.data.id]));
            showNotification(`New request from ${message.data.full_name}`, 'info');
            break;
          case 'updated_request':
            useRequests.getState().handleWebSocketUpdate(message.data, message.type);
            showNotification(`Request #${message.data.id} has been updated`, 'info');
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
  }, [addMessageListener, showNotification]);

  const handleReconnect = useCallback(() => {
    connect();
  }, [connect]);

  const handleRefresh = async () => {
    try {
      setSkip(0);
      await Promise.all([
        fetchRequests({ skip: 0, order_by: '-created_at, -updated_at', status: statusFilter, limit: 30 }),
        fetchStats()
      ]);
      showNotification('Data refreshed successfully', 'success');
    } catch (error) {
      console.error(error);
      showNotification('Failed to refresh data', 'error');
    }
  };

  // Effect to refresh data when status filter changes
  useEffect(() => {
    if (isInitialized) {
      handleRefresh();
    }
  }, [statusFilter]);

  const handleLoadMore = async () => {
    try {
      const newSkip = requests.length;
      setSkip(newSkip);
      await fetchRequests({ 
        skip: newSkip, 
        order_by: '-created_at, -updated_at', 
        status: statusFilter,
        limit: 30
      });
    } catch (error) {
      showNotification('Failed to load more requests', 'error');
    }
  };

  const stats = useMemo(() => ({
    total: useRequests.getState().totalRequest,
    pending: useRequests.getState().totalPending,
    completed: useRequests.getState().totalCompleted,
  }), [requests]);

  const assigneeOptions = useMemo(() => 
    assignees.map(assignee => ({
      value: assignee.id.toString(),
      label: assignee.full_name
    })),
    [assignees]
  );

  const filteredRequests = useMemo(() => {
    const searchTermLower = searchTerm.toLowerCase();
    return requests.filter(request => {
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesSearch = 
        request.full_name.toLowerCase().includes(searchTermLower) ||
        String(request.national_id).includes(searchTerm) ||
        String(request.medical_number || '').includes(searchTerm);
      return matchesStatus && matchesSearch;
    });
  }, [requests, searchTerm, statusFilter]);

  const handleSaveRequest = async (requestId, updates) => {
    try {
      await updateRequest(requestId, updates);
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Failed to update request', 'error');
    }
  };
  const initializeExpandedCards = useCallback((requests) => {
    if (requests.length > 0) {
      setExpandedCards(new Set(
        requests.slice(0, 10).map(request => request.id)
      ));
    }
  }, []);
  
  useEffect(() => {
    if (requests.length > 0 && expandedCards.size === 0) {
      initializeExpandedCards(requests);
    }
  }, [requests, initializeExpandedCards, expandedCards]);
  const toggleCard = useCallback((requestId) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  }, []);

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage your requests</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none items-center gap-2"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline"
            className="flex-1 sm:flex-none items-center gap-2"
            onClick={() => setShowUserStats(!showUserStats)}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="sm:inline">View Analytics</span>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          className="sm:col-span-2 lg:col-span-1"
        />
      </div>

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
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Requests
                  <Badge variant="secondary">
                    {stats.pending} pending
                  </Badge>
                </CardTitle>
                
                {/* Connection Status */}
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <motion.div
                    initial={false}
                    animate={{ 
                      scale: isConnected ? 1 : [1, 1.1, 1],
                      transition: { duration: 0.3 }
                    }}
                  >
                    <Badge 
                      variant={isConnected ? "success" : "warning"}
                      className="flex items-center gap-2"
                    >
                      {isConnected ? (
                        <>
                          <Wifi className="h-4 w-4" />
                          <span className="hidden sm:inline">Connected</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-4 w-4" />
                          <span className="hidden sm:inline">Disconnected</span>
                        </>
                      )}
                    </Badge>
                  </motion.div>

                  {!isConnected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReconnect}
                      className="h-7 px-2 flex items-center gap-1 text-xs"
                    >
                      <RefreshCcw className="h-3 w-3" />
                      <span className="hidden sm:inline">Reconnect</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
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
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            <AnimatePresence>
              {isLoading && skip === 0 ? (
                <div className="flex justify-center p-8">
                  <Loader className="h-8 w-8 animate-spin" />
                </div>
              ) : filteredRequests.length === 0 && remaining === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  No requests found
                </div>
              ) : (
                <>
                  {isRefreshing && (
                    <div className="absolute top-4 right-4">
                      <Loader className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {filteredRequests.map((request, index) => (
                    <RequestCard
                      key={request.id}
                      request={request}
                      onSave={handleSaveRequest}
                      assigneeOptions={assigneeOptions}
                      isExpanded={expandedCards.has(request.id)}
                      onToggle={() => toggleCard(request.id)}
                    />
                  ))}
                  {remaining > 0 && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        onClick={handleLoadMore}
                        disabled={isLoading}
                        className="w-full sm:w-auto flex items-center gap-2"
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

const StatCard = ({ title, value, icon: Icon, variant = 'default', description, className = "" }) => {
  const variants = {
    default: 'bg-primary/10 text-primary',
    warning: 'bg-yellow-500/10 text-yellow-500',
    success: 'bg-green-500/10 text-green-500',
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2 flex-wrap">
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
const RequestCard = ({ request, onSave, assigneeOptions, isExpanded, onToggle }) => {
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
      setTimeout(() => {
        onToggle();
      }, 300); 
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }} 
      layout 
      layoutId={`request-${request.id}`} 
      className="group"
    >
      <Card className="overflow-hidden border bg-card hover:bg-accent/5 transition-colors">
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Header with User Info - Always visible */}
          <div 
            className="flex items-start justify-between cursor-pointer"
            onClick={onToggle}
          >
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
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground hidden sm:flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {new Date(request.created_at).toLocaleString("en-us")}
              </div>
              <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {/* Mobile timestamp */}
          <div className="text-sm text-muted-foreground flex sm:hidden items-center gap-2">
            <Clock className="h-4 w-4" />
            {new Date(request.created_at).toLocaleString("en-us")}
          </div>

          {/* Expandable Content */}
          <AnimatePresence mode="popLayout">
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ 
                  duration: 0.2,
                  opacity: { duration: 0.15 },
                  height: { duration: 0.2 }
                }}
              >
                <div className="space-y-4 bg-muted/30 rounded-lg p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="w-full sm:w-auto flex items-center gap-2"
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}
  

export default Dashboard;