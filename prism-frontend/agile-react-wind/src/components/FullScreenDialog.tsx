
import ReactECharts from 'echarts-for-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getChartTitle, removeChartTitle } from '@/utils/chartUtils';

interface FullScreenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chartOption: any;
}

const FullScreenDialog = ({ open, onOpenChange, chartOption }: FullScreenDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full">
        <DialogHeader>
          <DialogTitle>
            {chartOption && getChartTitle(chartOption)}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          {chartOption && (
            <ReactECharts 
              option={removeChartTitle(chartOption)} 
              style={{ height: '100%', width: '100%', minHeight: '500px' }} 
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FullScreenDialog;
