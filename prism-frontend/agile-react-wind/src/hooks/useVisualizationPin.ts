
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDatabaseContext } from '@/contexts/DatabaseContext';

export const useVisualizationPin = (visualizationId?: string) => {
  const [pinningChart, setPinningChart] = useState<string | null>(null);
  const [pinnedCharts, setPinnedCharts] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { connectedDatabaseId } = useDatabaseContext();

  const pinVisualization = async (chartId: string) => {
    try {
      setPinningChart(chartId);
      const accessToken = localStorage.getItem('access_token');
      const tokenType = localStorage.getItem('token_type');
      
      if (!accessToken) {
        toast({
          title: "Error",
          description: "No access token found. Please sign in.",
          variant: "destructive"
        });
        return;
      }

      if (!connectedDatabaseId) {
        toast({
          title: "Database Error",
          description: "Please connect a database first.",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/pin-visualization', {
        method: 'POST',
        headers: {
          'Authorization': `${tokenType} ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chart_id: chartId,
          db_id: connectedDatabaseId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to pin visualization');
      }

      // Only add the specific chart that was successfully pinned
      setPinnedCharts(prev => {
        const newSet = new Set(prev);
        newSet.add(chartId);
        return newSet;
      });

      toast({
        title: "Success",
        description: "Visualization pinned successfully!",
      });

      // Hard reload the page after successful pin
      window.location.reload();
    } catch (error) {
      console.error('Error pinning visualization:', error);
      toast({
        title: "Error",
        description: "Failed to pin visualization. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPinningChart(null);
    }
  };

  return {
    pinVisualization,
    pinningChart,
    pinnedCharts
  };
};
