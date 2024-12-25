import React from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';

const AnalyticsView = ({ data, onClose }) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="mb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Request Analytics</DialogTitle>

          </div>
        </DialogHeader>
        
        <div className="mt-4 p-4 bg-card rounded-lg border">
          <TimelineChart data={data} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const TimelineChart = ({ data }) => {
  // Process data for the chart
  const processedData = React.useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayRequests = data.filter(req => 
        new Date(req.timestamp).toISOString().split('T')[0] === date
      );

      return {
        date: new Date(date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        total: dayRequests.length,
        waiting: dayRequests.filter(r => r.status === 'waiting').length,
        completed: dayRequests.filter(r => r.status === 'completed').length,
      };
    });
  }, [data]);

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280"
            tick={{ fill: '#6b7280' }}
          />
          <YAxis 
            stroke="#6b7280"
            tick={{ fill: '#6b7280' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '6px'
            }}
            labelStyle={{ color: '#e5e7eb' }}
            itemStyle={{ color: '#e5e7eb' }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="total" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Total Requests" 
            dot={{ fill: '#3b82f6', strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="waiting" 
            stroke="#eab308" 
            strokeWidth={2}
            name="Waiting" 
            dot={{ fill: '#eab308', strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="completed" 
            stroke="#22c55e" 
            strokeWidth={2}
            name="Completed" 
            dot={{ fill: '#22c55e', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsView;