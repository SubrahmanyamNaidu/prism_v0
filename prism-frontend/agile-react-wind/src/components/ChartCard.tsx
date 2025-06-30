
import ReactECharts from 'echarts-for-react';
import { Button } from '@/components/ui/button';
import { Fullscreen, Plus, Check } from 'lucide-react';
import { truncateTitle, getChartTitle, removeChartTitle } from '@/utils/chartUtils';

interface ChartCardProps {
  chartOption: any;
  onPin: (chartId: string) => void;
  onFullScreen: (chartOption: any) => void;
  isPinning: boolean;
  isPinned: boolean;
  chartId: string;
}

const ChartCard = ({ chartOption, onPin, onFullScreen, isPinning, isPinned, chartId }: ChartCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 relative group">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-gray-800" title={getChartTitle(chartOption)}>
          {truncateTitle(getChartTitle(chartOption))}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPin(chartId)}
            disabled={isPinning || isPinned}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isPinned ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFullScreen(chartOption)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Fullscreen className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ReactECharts option={removeChartTitle(chartOption)} style={{ height: '400px', width: '100%' }} />
    </div>
  );
};

export default ChartCard;
