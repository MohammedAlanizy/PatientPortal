import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Filter, Download, RefreshCcw, User, FileText, Clock, Hash, Clipboard, UserCircle, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, formatDistanceToNow, formatDistance, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { useRequests } from '@/hooks/useRequests';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const DateFilter = ({ onFilterChange, selectedDate, customDateRange }) => {
  const dateFilters = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'this_week', label: 'This Week' },
    { id: 'this_month', label: 'This Month' }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full sm:w-auto">
        {dateFilters.map(filter => (
          <Button
            key={filter.id}
            variant={selectedDate === filter.id ? 'default' : 'outline'}
            onClick={() => onFilterChange(filter.id)}
            className="flex items-center gap-2 text-sm h-9"
            size="sm"
          >
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">{filter.label}</span>
            <span className="sm:hidden">{filter.label.split(' ')[0]}</span>
          </Button>
        ))}
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant={selectedDate === 'custom' ? 'default' : 'outline'}
            className="flex items-center gap-2 text-sm h-9 w-full sm:w-auto"
            size="sm"
          >
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            {customDateRange.from && customDateRange.to ? (
              <span className="truncate">
                {format(customDateRange.from, 'MMM d')} - {format(customDateRange.to, 'MMM d')}
              </span>
            ) : (
              'Custom'
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            initialFocus
            mode="range"
            defaultMonth={customDateRange.from}
            selected={customDateRange}
            onSelect={(range) => onFilterChange('custom', range)}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

const HistoryView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [skip, setSkip] = useState(0);
  const [customDateRange, setCustomDateRange] = useState({ from: null, to: null });
  const { requests, isLoading, error, fetchRequests, remaining } = useRequests();

  const getDateRange = (period) => {
    if (period === 'custom' && customDateRange.from && customDateRange.to) {
      return {
        start: format(customDateRange.from,  "yyyy-MM-dd'T'00:00:00"),
        end: format(customDateRange.to, "yyyy-MM-dd'T'23:59:59")
      };
    }
    
    const now = new Date();
    const ranges = {

      today: {
        start: format(startOfDay(now), "yyyy-MM-dd'T'00:00:00"),
        end: format(endOfDay(now), "yyyy-MM-dd'T'23:59:59")
      },
      this_week: {
        start: format(startOfWeek(now),  "yyyy-MM-dd'T'00:00:00"),
        end: format(endOfWeek(now), "yyyy-MM-dd'T'23:59:59")
      },
      this_month: {
        start: format(startOfMonth(now),  "yyyy-MM-dd'T'00:00:00"),
        end: format(endOfMonth(now), "yyyy-MM-dd'T'23:59:59")
      }
    };
    return ranges[period] || null;
  };

  const handleDateFilter = (type, range = null) => {
    setSelectedDate(type);
    setSkip(0);
  
    let dateRange = null;
    if (type === 'custom' && range) {
      setCustomDateRange(range);
      dateRange = {
        start: format(range.from,  "yyyy-MM-dd'T'00:00:00"),
        end: format(range.to, "yyyy-MM-dd'T'23:59:59"),
      };
    } else {
      dateRange = getDateRange(type);
      setCustomDateRange({ from: null, to: null });
    }
  
    fetchRequests({
      skip: 0,
      search: searchTerm,
      order_by: '-created_at, -updated_at',
      ...(selectedStatus !== "all" && { status: selectedStatus }),
      ...(dateRange && {
        start_date: dateRange.start,
        end_date: dateRange.end,
      }),
    });
  };

  useEffect(() => {
    handleRefresh();
  }, []);
  useEffect(() => {
    handleRefresh();
  }, [selectedStatus]); // Trigger handleRefresh when selectedStatus changes

  const handleRefresh = () => {
    setSkip(0);
    const dateRange = selectedDate === 'custom'
      ? customDateRange.from && customDateRange.to
        ? {
            start: format(customDateRange.from,  "yyyy-MM-dd'T'00:00:00"),
            end: format(customDateRange.to, "yyyy-MM-dd'T'23:59:59"),
          }
        : null
      : getDateRange(selectedDate);
  
    fetchRequests({
      skip: 0,
      search: searchTerm,
      order_by: '-created_at, -updated_at',
      ...(selectedStatus !== "all" && { status: selectedStatus }),
      ...(dateRange && {
        start_date: dateRange.start,
        end_date: dateRange.end,
      }),
    });
  };

  const handleLoadMore = () => {
    const newSkip = requests.length;
    setSkip(newSkip);
    const dateRange = getDateRange(selectedDate);
    fetchRequests({ 
      skip: newSkip,
      order_by: '-created_at, -updated_at',
      ...(selectedStatus !== "all" && { status: selectedStatus }),
      ...(dateRange && {
        start_date: dateRange.start,
        end_date: dateRange.end
      }),
    });
  };

  const handleExport = () => {
    const csv = requests.map(request => ({
      id: request.id,
      name: request.full_name,
      medical_number: request.medical_number,
      status: request.status,
      created_at: format(new Date(request.created_at), 'yyyy-MM-dd HH:mm:ss'),
      created_by: request.created_by,
      assigned_to: request.assigned_to,
      notes: request.notes
    }));
    
    const csvString = [
      ['ID', 'Name', 'Medical Number', 'Status', 'Created At', 'Created By', 'Assigned To', 'Notes'],
      ...csv.map(row => Object.values(row))
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requests-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const filteredRequests = requests?.filter(request => 
    (request.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    String(request.national_id).includes(searchTerm) ||
    String(request.medical_number || '').includes(searchTerm)) &&
    (selectedStatus === 'all' || request.status === selectedStatus)
  );

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col space-y-4"
      >
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl">Request History</CardTitle>
                <CardDescription>
                  View and manage all processed requests
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="default"
                  className="flex-1 sm:flex-none flex items-center gap-2 bg-primary hover:bg-primary/90"
                  onClick={handleRefresh}
                  size="sm"
                >
                  <RefreshCcw className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 sm:flex-none flex items-center gap-2"
                  onClick={handleExport}
                  size="sm"
                >
                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col space-y-4">
                <DateFilter 
                  onFilterChange={handleDateFilter}
                  selectedDate={selectedDate}
                  customDateRange={customDateRange}
                />

                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <AnimatePresence>
                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <span className="loading loading-spinner loading-lg"></span>
                  </div>
                ) : error ? (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {error}
                    </AlertDescription>
                  </Alert>
                ) : filteredRequests?.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No requests found matching your criteria.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {filteredRequests?.map((request) => (
                      <RequestCard key={request.id} request={request} />
                    ))}
                    {remaining > 0 && (
                      <div className="flex justify-center pt-4">
                        <Button
                          variant="outline"
                          onClick={handleLoadMore}
                          disabled={isLoading}
                          className="w-full sm:w-auto"
                        >
                          Load More ({remaining} remaining)
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

const RequestCard = ({ request }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusColors = {
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
  };

  const getDurationBadgeColor = (durationMinutes) => {
    if (durationMinutes <= 5) return 'bg-green-100 text-green-800';
    if (durationMinutes <= 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const createdAt = new Date(request.created_at);
  const updatedAt = request.updated_at ? new Date(request.updated_at) : null;

  const getFormattedTime = (date) => {
    const now = new Date();
    const diffInHours = Math.abs(now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else if (diffInHours < 168) { // 7 days
      return format(date, 'EEEE h:mm a');
    } else {
      return format(date, 'MMM d, yyyy h:mm a');
    }
  };

  const getDurationDisplay = () => {
    if (!updatedAt || request.status === 'pending') {
      const duration = formatDistanceToNow(createdAt);
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          In progress: {duration}
        </Badge>
      );
    }

    const processingDuration = formatDistance(updatedAt, createdAt);
    const durationMinutes = Math.abs(updatedAt - createdAt) / (1000 * 60);
    
    return (
      <Badge variant="secondary" className={getDurationBadgeColor(durationMinutes)}>
        Completed in: {processingDuration}
      </Badge>
    );
  };

  return (
    <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    layout
  >
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div
        className="p-4 sm:p-6 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold">{request.full_name}</h3>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{getFormattedTime(createdAt)}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        Created: {format(createdAt, 'PPpp')}
                        {updatedAt && (
                          <div>Updated: {format(updatedAt, 'PPpp')}</div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {getDurationDisplay()}
                </div>
              </div>
            </div>
            <div>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statusColors[request.status]}`}>
                {request.status}
              </span>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-4"
              >
                <Separator className="mb-4" />
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">ID:</span>
                      <span className="text-sm break-all">{request.national_id}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Medical Number:</span>
                      <span className="text-sm break-all">{request.medical_number || 'Not assigned'}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Assigned To:</span>
                      <span className="text-sm">{request.assignee?.full_name || 'Not assigned'}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center space-x-2">
                        <UserCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Created By:</span>
                        <span className="text-sm">{request.creator?.username || 'Unknown'}</span>
                      </div>
                      <Badge variant="outline" className="mt-1 sm:mt-0">
                        {request.creator?.role || 'No role'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-2">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Clipboard className="h-4 w-4 text-muted-foreground" />
                        Notes
                      </span>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap rounded-lg bg-muted/50 p-4">
                        {request.notes || 'No notes available'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  </motion.div>
);
};

const getDefaultDateFilter = () => ({
from: null,
to: null,
type: 'all'
});

export const useHistoryFilters = () => {
const [filters, setFilters] = useState({
  date: getDefaultDateFilter(),
  status: 'all',
  search: ''
});

const updateFilters = (type, value) => {
  setFilters(prev => ({
    ...prev,
    [type]: value
  }));
};

return {
  filters,
  updateFilters,
  resetFilters: () => setFilters({
    date: getDefaultDateFilter(),
    status: 'all',
    search: ''
  })
};
};

export default HistoryView;

        