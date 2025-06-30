
import { KPIItem } from '@/types/kpi';
import { useKPIPagination } from '@/hooks/useKPIPagination';
import KPICard from './KPICard';
import KPITable from './KPITable';

interface KPIListProps {
  kpis: KPIItem[];
}

const KPIList = ({ kpis }: KPIListProps) => {
  const paginationHook = useKPIPagination();

  return (
    <div className="space-y-8">
      {kpis.map((kpi, kpiIndex) => (
        <div key={kpiIndex} className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800 capitalize">
            {kpi.name.replace(/_/g, ' ')}
          </h2>
          
          {kpi.result.length === 1 ? (
            // Single result - show as card
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <KPICard kpiName={kpi.name} result={kpi.result[0]} />
            </div>
          ) : (
            // Multiple results - show as paginated table
            <KPITable 
              kpiName={kpi.name} 
              results={kpi.result} 
              paginationHook={paginationHook}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default KPIList;
