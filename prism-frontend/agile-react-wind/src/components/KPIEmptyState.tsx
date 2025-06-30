
import AppSidebar from './AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus } from 'lucide-react';

interface KPIEmptyStateProps {
  message?: string;
  onAddKPI?: () => void;
}

const KPIEmptyState = ({ message, onAddKPI }: KPIEmptyStateProps) => {
  // Determine if we should show the button as disabled based on the message
  const isDatabaseMissing = message?.includes("connect to a database") || message?.includes("Connect to a database");

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
                {isDatabaseMissing ? (
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
                ) : (
                  <Button className="flex items-center gap-2" onClick={onAddKPI}>
                    <Plus className="h-4 w-4" />
                    Add KPI
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">
                  {message || "No KPI data available"}
                </div>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default KPIEmptyState;
