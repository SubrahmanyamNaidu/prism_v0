
import { useState } from 'react';
import AppSidebar from './AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import VisualizationsGrid from './VisualizationsGrid';
import FullScreenDialog from './FullScreenDialog';
import { useVisualizationData } from '@/hooks/useVisualizationData';
import { useVisualizationPin } from '@/hooks/useVisualizationPin';

const Visualizations = () => {
  const { chartData, loading } = useVisualizationData();
  const { pinVisualization, pinningChart, pinnedCharts } = useVisualizationPin();
  const [fullScreenChart, setFullScreenChart] = useState<any>(null);
  const [fullScreenOpen, setFullScreenOpen] = useState(false);

  const openFullScreen = (chartOption: any) => {
    setFullScreenChart(chartOption);
    setFullScreenOpen(true);
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50">
          <AppSidebar />
          <SidebarInset>
            <main className="flex-1 p-6">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                  Data Visualizations
                </h1>
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg text-gray-600">Loading charts...</div>
                </div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  if (!chartData || !chartData.charts || chartData.charts.length === 0) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50">
          <AppSidebar />
          <SidebarInset>
            <main className="flex-1 p-6">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                  Data Visualizations
                </h1>
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg text-gray-600">No chart data available</div>
                </div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  // Separate charts into pinned and recommended
  const pinnedChartsData = chartData.charts.filter(chart => chart.pinned === true);
  const recommendedChartsData = chartData.charts.filter(chart => chart.pinned === false);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <SidebarInset>
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                Data Visualizations
              </h1>
              
              {/* Pinned Section */}
              {pinnedChartsData.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Pinned Visualizations
                  </h2>
                  <VisualizationsGrid
                    charts={pinnedChartsData}
                    onPin={pinVisualization}
                    onFullScreen={openFullScreen}
                    pinningChart={pinningChart}
                    pinnedCharts={pinnedCharts}
                  />
                </div>
              )}

              {/* Recommended Section */}
              {recommendedChartsData.length > 0 && (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Recommended Visualizations
                  </h2>
                  <VisualizationsGrid
                    charts={recommendedChartsData}
                    onPin={pinVisualization}
                    onFullScreen={openFullScreen}
                    pinningChart={pinningChart}
                    pinnedCharts={pinnedCharts}
                  />
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>

      <FullScreenDialog
        open={fullScreenOpen}
        onOpenChange={setFullScreenOpen}
        chartOption={fullScreenChart}
      />
    </SidebarProvider>
  );
};

export default Visualizations;
