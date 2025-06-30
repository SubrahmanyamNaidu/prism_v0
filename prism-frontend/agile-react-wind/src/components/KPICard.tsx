
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPIResultItem } from '@/types/kpi';
import { getDisplayLabel, getNumericValue, formatCurrency } from '@/utils/kpiUtils';

interface KPICardProps {
  kpiName: string;
  result: KPIResultItem;
}

const KPICard = ({ kpiName, result }: KPICardProps) => {
  return (
    <Card className="bg-white shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-800">
          {getDisplayLabel(result, kpiName)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-blue-600">
          {formatCurrency(getNumericValue(result))}
        </div>
      </CardContent>
    </Card>
  );
};

export default KPICard;
