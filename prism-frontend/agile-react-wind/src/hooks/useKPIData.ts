import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { KPIResponse } from '@/types/kpi';
import { makeAuthenticatedRequest } from '@/utils/authUtils';
import { useDatabaseContext } from '@/contexts/DatabaseContext';

interface ConnectedDatabase {
  database: string;
  db_type: string;
  db_id: string;
}

export const useKPIData = () => {
  const [kpiData, setKpiData] = useState<KPIResponse | null>(null);
  const [connectedDatabases, setConnectedDatabases] = useState<ConnectedDatabase[]>([]);
  const [loading, setLoading] = useState(true);
  const [databasesLoading, setDatabasesLoading] = useState(true);
  const { toast } = useToast();
  const { connectedDatabaseId } = useDatabaseContext();

  const fetchConnectedDatabases = async () => {
    try {
      setDatabasesLoading(true);
      const response = await makeAuthenticatedRequest('http://127.0.0.1:8000/connected-dbs');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Connected databases:', data);
        setConnectedDatabases(data);
      } else {
        console.error('Failed to fetch connected databases');
        setConnectedDatabases([]);
      }
    } catch (error) {
      console.error('Error fetching connected databases:', error);
      setConnectedDatabases([]);
    } finally {
      setDatabasesLoading(false);
    }
  };

  const fetchKPIData = async () => {
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

      const response = await fetch('http://127.0.0.1:8000/get-kpi', {
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
        throw new Error('Failed to fetch KPI data');
      }

      const data = await response.json();
      console.log('KPI data received:', data);
      setKpiData(data);
    } catch (error) {
      console.error('Error fetching KPI data:', error);
      toast({
        title: "Error",
        description: "Failed to load KPI data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectedDatabases();
    if (connectedDatabaseId) {
      fetchKPIData();
    } else {
      setLoading(false);
    }
  }, [connectedDatabaseId, toast]);

  return {
    kpiData,
    connectedDatabases,
    loading,
    databasesLoading,
    refetchKPIData: fetchKPIData,
    refetchDatabases: fetchConnectedDatabases
  };
};
