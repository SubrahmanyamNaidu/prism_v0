
import { useState, useEffect } from 'react';
import { Plus, Database, Cable, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import ConnectDatabaseComponent from './ConnectDatabase';
import { makeAuthenticatedRequest } from '@/utils/authUtils';
import { useDatabaseContext } from '@/contexts/DatabaseContext';

interface ConnectedDatabase {
  database: string;
  db_type: string;
  db_id: string;
}

const DataSources = () => {
  const { toast } = useToast();
  const { connectedDatabaseId, setConnectedDatabase } = useDatabaseContext();
  const [connectedDatabases, setConnectedDatabases] = useState<ConnectedDatabase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectDialog, setShowConnectDialog] = useState(false);

  const fetchConnectedDatabases = async () => {
    try {
      setLoading(true);
      const response = await makeAuthenticatedRequest('http://127.0.0.1:8000/connected-dbs');
      
      if (response.ok) {
        const data = await response.json();
        setConnectedDatabases(data);
        
        // Auto-connect to first database if none is connected yet and databases exist
        if (!connectedDatabaseId && data.length > 0) {
          setConnectedDatabase(data[0]);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch connected databases",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching connected databases:', error);
      toast({
        title: "Error",
        description: "Failed to connect to the server",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnectedDatabases();
  }, []);

  const getTypeIcon = (type: string) => {
    return <Database className="h-4 w-4" />;
  };

  const handleConnect = (database: ConnectedDatabase) => {
    if (connectedDatabaseId === database.db_id) {
      // If clicking on already connected database, disconnect it
      setConnectedDatabase(null);
    } else {
      // Connect to new database (this will disconnect the current one)
      setConnectedDatabase(database);
    }
  };

  const isConnected = (dbId: string) => connectedDatabaseId === dbId;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <div className="p-6 w-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Data Sources</h1>
                <p className="text-gray-600 mt-2">Manage your database connections and data sources</p>
              </div>
              <Button onClick={() => setShowConnectDialog(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Data Source
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-600">Loading connected databases...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {connectedDatabases.map((db) => (
                  <Card key={db.db_id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(db.db_type)}
                          <CardTitle className="text-lg">{db.database}</CardTitle>
                        </div>
                        <Badge className={isConnected(db.db_id) ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                          {isConnected(db.db_id) ? "Connected" : "Available"}
                        </Badge>
                      </div>
                      <CardDescription>Database ID: {db.db_id}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Cable className="h-3 w-3" />
                          <span>Type: {db.db_type.toUpperCase()}</span>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => handleConnect(db)}
                            variant={isConnected(db.db_id) ? "outline" : "default"}
                            className="flex-1 flex items-center gap-2"
                          >
                            {isConnected(db.db_id) && <CheckCircle className="h-4 w-4" />}
                            {isConnected(db.db_id) ? "Disconnect" : "Connect"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {connectedDatabases.length === 0 && !loading && (
                  <div className="col-span-full text-center py-12">
                    <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No connected databases found</h3>
                    <p className="text-gray-600">Connect your first database to get started with data analysis.</p>
                  </div>
                )}
              </div>
            )}

            <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
              <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-6">
                <DialogHeader className="sr-only">
                  <DialogTitle>Connect Database</DialogTitle>
                </DialogHeader>
                <div className="h-full overflow-auto">
                  <ConnectDatabaseComponent />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DataSources;
