import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { UserCheck, Award, TrendingUp, RefreshCw, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

const UserStatsChart = ({ isOpen, onClose, fetchUserStats, useAssignees }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const handleFetchStats = async () => {
    setIsLoading(true);
    try {
      const stats = await fetchUserStats();
      setData(useAssignees.getState().stats.stats);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      handleFetchStats();
    }
  }, [isOpen]);

  const totalCompleted = React.useMemo(() => 
    data.reduce((sum, user) => sum + user.completed, 0)
  , [data]);

  const topPerformer = React.useMemo(() => {
    if (!data.length) return null;
    return data.reduce((top, current) => 
      current.completed > top.completed ? current : top
    , data[0]);
  }, [data]);

  const sortedData = React.useMemo(() => 
    [...data].sort((a, b) => b.completed - a.completed)
  , [data]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-4xl mx-auto p-4 sm:p-6">
        <DialogClose className="absolute right-2 top-2 sm:right-4 sm:top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        {isLoading ? (
          <div className="min-h-[400px] sm:min-h-[600px] flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
              <div className="relative bg-blue-500 p-4 rounded-xl">
                <RefreshCw className="h-8 w-8 text-white animate-spin" />
              </div>
            </div>
            <p className="text-lg font-medium text-muted-foreground">Fetching latest statistics...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <UserCheck className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                  User Performance
                </DialogTitle>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                {lastUpdated && (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Last updated: {lastUpdated.toLocaleTimeString("en-US")}
                  </p>
                )}
                <Button
                  variant="outline"
                  className="flex items-center gap-2 w-full sm:w-auto"
                  onClick={handleFetchStats}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 sm:p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                  <UserCheck className="h-4 w-4" />
                  <h3 className="text-sm font-semibold">Total Users</h3>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300">{data.length}</p>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-3 sm:p-4 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <h3 className="text-sm font-semibold">Total Completed</h3>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300">{totalCompleted}</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-3 sm:p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                  <Award className="h-4 w-4" />
                  <h3 className="text-sm font-semibold">Top Performer</h3>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-300 truncate">
                  {topPerformer?.full_name || 'N/A'}
                </p>
              </div>
            </div>

            {/* User Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-h-[300px] sm:max-h-[400px] overflow-y-auto p-1">
              {sortedData.map((user, index) => (
                <div 
                  key={user.full_name}
                  className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 hover:shadow-lg transition-all duration-200"
                >
                  <div className="absolute top-3 right-3 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-full">
                    <span className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400">#{index + 1}</span>
                  </div>
                  
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 mb-2 pr-8 truncate">
                    {user.full_name}
                  </h3>
                  
                  <div className="mt-1 sm:mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1">
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
                          <div 
                            className="bg-blue-500 h-1.5 sm:h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${Math.min((user.completed / (topPerformer?.completed || 1)) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                      <span className="font-semibold text-xs sm:text-sm text-blue-600 dark:text-blue-400 min-w-[2.5rem] text-right">
                        {user.completed}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Completed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserStatsChart;