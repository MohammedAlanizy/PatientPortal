import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, Inbox, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatsSection = ({ stats }) => {
  const percentageChange = 12.5; // Example percentage - replace with actual calculation
  const isIncreasing = percentageChange > 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Requests Card */}
      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-50"/>
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex items-center space-x-1 text-sm">
                <span className={`flex items-center ${isIncreasing ? 'text-green-500' : 'text-red-500'}`}>
                  {isIncreasing ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {Math.abs(percentageChange)}%
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-2xl font-bold tracking-tight">{stats.total}</h3>
                <span className="text-sm text-muted-foreground">this year</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Requests Card */}
      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-500/10 opacity-50"/>
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Inbox className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                Today
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Today's Requests</p>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-2xl font-bold tracking-tight">{stats.today}</h3>
                <span className="text-sm text-muted-foreground">new requests</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Requests Card */}
      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 opacity-50"/>
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                Active
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-2xl font-bold tracking-tight">{stats.pending}</h3>
                <span className="text-sm text-muted-foreground">in queue</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completed Requests Card */}
      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-500/10 opacity-50"/>
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ 
                    width: `${(stats.completed / (stats.total || 1)) * 100}%` 
                  }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-2xl font-bold tracking-tight">{stats.completed}</h3>
                <span className="text-sm text-muted-foreground">processed</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsSection;