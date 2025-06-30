
import { useState } from 'react';
import AppSidebar from './AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus } from 'lucide-react';
import AddKPIDialog from './AddKPIDialog';
import KPILoadingState from './KPILoadingState';
import KPIEmptyState from './KPIEmptyState';
import KPIList from './KPIList';
import { useKPIData } from '@/hooks/useKPIData';
import { KPIItem } from '@/types/kpi';

const KPI = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { kpiData, connectedDatabases, loading, databasesLoading, refetchKPIData } = useKPIData();

  const handleKPIAdded = () => {
    refetchKPIData();
  };

  // Show loading state while either KPI data or databases are loading
  if (loading || databasesLoading) {
    return <KPILoadingState />;
  }

  // Check if there are no connected databases (empty array)
  const hasConnectedDatabases = connectedDatabases.length > 0;

  // Check if kpis is an empty object or if no KPIs exist
  const hasKPIs = kpiData && 
    (Array.isArray(kpiData.kpis) ? kpiData.kpis.length > 0 : Object.keys(kpiData.kpis).length > 0);

  if (!hasConnectedDatabases) {
    return (
      <KPIEmptyState 
        message="Please connect to a database first to view and manage KPIs"
        onAddKPI={() => setShowAddDialog(true)}
      />
    );
  }

  if (!kpiData || !hasKPIs) {
    return (
      <>
        <KPIEmptyState 
          message={kpiData?.message || "No KPI data available"}
          onAddKPI={() => setShowAddDialog(true)}
        />
        <AddKPIDialog 
          open={showAddDialog} 
          onOpenChange={setShowAddDialog}
          onKPIAdded={handleKPIAdded}
        />
      </>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <SidebarInset>
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">
                  Key Performance Indicators
                </h1>
                {hasConnectedDatabases ? (
                  <Button className="flex items-center gap-2" onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4" />
                    Add KPI
                  </Button>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button className="flex items-center gap-2" disabled>
                          <Plus className="h-4 w-4" />
                          Add KPI
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Connect to a database first</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              
              <KPIList kpis={kpiData.kpis as KPIItem[]} />
            </div>
          </main>
        </SidebarInset>
      </div>
      <AddKPIDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog}
        onKPIAdded={handleKPIAdded}
      />
    </SidebarProvider>
  );
};

export default KPI;
