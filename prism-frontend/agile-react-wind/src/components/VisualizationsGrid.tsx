
import ChartCard from './ChartCard';

interface VisualizationsGridProps {
  charts: any[];
  onPin: (chartId: string) => void;
  onFullScreen: (chartOption: any) => void;
  pinningChart: string | null;
  pinnedCharts: Set<string>;
}

const VisualizationsGrid = ({ 
  charts, 
  onPin, 
  onFullScreen, 
  pinningChart, 
  pinnedCharts 
}: VisualizationsGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {charts.map((chartOption, index) => (
        <ChartCard
          key={chartOption.chart_id || index}
          chartOption={chartOption}
          onPin={onPin}
          onFullScreen={onFullScreen}
          isPinning={pinningChart === chartOption.chart_id}
          isPinned={pinnedCharts.has(chartOption.chart_id)}
          chartId={chartOption.chart_id}
        />
      ))}
    </div>
  );
};

export default VisualizationsGrid;
