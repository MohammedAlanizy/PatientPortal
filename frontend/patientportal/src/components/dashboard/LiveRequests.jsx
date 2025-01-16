import React, { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useRequests } from '@/hooks/useRequests';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Loader, 
  User, 
  Clock, 
  Wifi, 
  WifiOff,
  CheckCircle2,
  Clock3,
  UserCheck,
  Calendar,
  RefreshCw,
  RefreshCcw
} from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';

const formatDateTime = (dateString) => {
  
  return new Date(dateString).toLocaleString('en-UK', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const RequestStatusBadge = ({ status }) => {
  const variants = {
    pending: "bg-yellow-500/25 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/30 border-yellow-500/50",
    completed: "bg-green-500/25 text-green-600 dark:text-green-400 hover:bg-green-500/30 border-green-500/50"
  };

  const icons = {
    pending: Clock3,
    completed: CheckCircle2
  };

  const Icon = icons[status];

  return (
    <Badge 
      variant="outline" 
      className={`${variants[status]} flex items-center gap-1.5 transition-all duration-200`}
    >
      <Icon className="h-3.5 w-3.5" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const TimeInfo = ({ icon: Icon, label, timestamp }) => (
  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
    <Icon className="h-3.5 w-3.5" />
    <span className="font-medium">{label}:</span>
    <span>{formatDateTime(timestamp)}</span>
  </div>
);

const RequestCard = ({ request }) => {
  const isPending = request.status === 'pending';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{
        layout: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 }
      }}
      className="group"
    >
      <Card className="bg-muted/80 dark:bg-muted/40 hover:bg-accent/80 dark:hover:bg-accent/40 transition-all duration-300 border-border/80">
        <CardContent className="p-5">
          <div className="flex items-start gap-5">
            <motion.div 
              className="h-12 w-12 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <User className="h-6 w-6 text-primary dark:text-primary-foreground" />
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="font-semibold text-lg truncate text-card-foreground">{request.full_name}</h3>
                <RequestStatusBadge status={request.status} />
              </div>
              
              <div className="space-y-2">
                <TimeInfo 
                  icon={Calendar} 
                  label="Created" 
                  timestamp={request.created_at}
                />
                
                {!isPending && request.updated_at && (
                  <TimeInfo 
                    icon={RefreshCw} 
                    label="Updated" 
                    timestamp={request.updated_at}
                  />
                )}

                {!isPending && request.assignee && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span className="font-medium">Assigned to:</span>
                    <span>{request.assignee.full_name}</span>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const LiveRequests = () => {
  const { isConnected, addMessageListener, connect } = useWebSocket();
  const { fetchRequests } = useRequests();
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const pollingIntervalRef = React.useRef(null);
  const countdownIntervalRef = React.useRef(null);
  const allRequests = useRequests(state => state.requests).slice(0, 10);
  const { showNotification } = useNotification();
  const fetchLatestRequests = async () => {
    try {
      const response = await fetchRequests({ limit: 10, skip: 0, order_by: '-created_at, -updated_at' });
      useRequests.setState(prev => {
        const newRequests = response?.data?.results || [];
        
        return {...prev, newRequests};
      });
      
      setCountdown(5); // Reset countdown after fetch
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isConnected) {
      pollingIntervalRef.current = setInterval(fetchLatestRequests, 5000);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => (prev > 0 ? prev - 1 : 5));
        connect();
      }, 1000);
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [isConnected]);

  const handleReconnect = useCallback(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    fetchLatestRequests();
  }, []);
  const convertUTCToLocal = (utcDate) => {
    if (!utcDate) return null;
    const date = new Date(utcDate);
    return new Date(date.getTime() - date.getTimezoneOffset() );
  };
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
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    const cleanup = addMessageListener(handleMessage);
    return () => cleanup();
  }, [addMessageListener]);

    const handleNewRequest = useCallback((newRequest) => {
      const currentRequests = useRequests.getState().requests;
      newRequest.created_at = convertUTCToLocal(newRequest.created_at);
      
      if (!currentRequests.some(req => req.id === newRequest.id)) {
        useRequests.setState(state => ({
          requests: [newRequest, ...state.requests]
        }));
        showNotification(`New request from ${newRequest.full_name}`, 'info');
      }
    }, [showNotification]);
  
    const handleUpdatedRequest = useCallback((updatedRequest) => {
      updatedRequest.created_at = convertUTCToLocal(updatedRequest.created_at);
      useRequests.setState(state => {
        // Remove the old request and add the updated one at the front
        const newRequests = state.requests
          .filter(req => req.id !== updatedRequest.id) // Remove the old request
          .map(req => req); // Map over the remaining requests to keep them intact
    
        newRequests.unshift(updatedRequest);
    
        showNotification(`Request with ${updatedRequest.full_name} has been updated`, 'info');
    
        return {
          ...state,
          requests: newRequests, // Set the new requests list
        };
      });
    }, [showNotification]);
  return (
    <Card className="space-y-8">
       <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <CardTitle className="text-2xl font-bold flex items-center gap-3">
          Live Requests
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/30"
          />
        </CardTitle>
        <div className="flex items-center gap-3">
          {!isConnected && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2"
            >
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                <span>Next update in</span>
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-medium">
                  {countdown}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReconnect}
                className="flex items-center gap-2 hover:bg-primary/10"
              >
                <RefreshCcw className="h-4 w-4" />
                Reconnect
              </Button>
            </motion.div>
          )}
          <Badge 
            variant={isConnected ? "success" : "warning"}
            className="flex items-center gap-2 py-1.5 px-3"
          >
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4" />
                Real-time
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4" />
                Polling
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
    <CardContent className="space-y-4 max-h-[calc(100vh-16rem)] overflow-y-auto p-5">
      <AnimatePresence mode="popLayout">
        {isLoading ? (

            <Loader className="h-8 w-8 animate-spin text-primary" />
        ) : allRequests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center p-8 text-muted-foreground"
          >
            No requests yet
          </motion.div>
        ) : (
          <motion.div layout className="space-y-5">
            {allRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </CardContent>
  </Card>
  );
};

export default LiveRequests;