
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useDatabaseContext } from '@/contexts/DatabaseContext';

interface ChartData {
  _id: string;
  charts: any[];
}

export const useVisualizationData = () => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { connectedDatabaseId } = useDatabaseContext();

  useEffect(() => {
    const fetchChartData = async () => {
      try {
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

        const response = await fetch('http://127.0.0.1:8000/get-visualization', {
          method: 'POST',
          headers: {
            'Authorization': `${tokenType} ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            db_id: connectedDatabaseId
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch chart data');
        }

        const data = await response.json();
        console.log('Chart data received:', data);
        setChartData(data);
      } catch (error) {
        console.error('Error fetching chart data:', error);
        toast({
          title: "Error",
          description: "Failed to load chart data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (connectedDatabaseId) {
      fetchChartData();
    } else {
      setLoading(false);
    }
  }, [toast, connectedDatabaseId]);

  return { chartData, loading };
};
