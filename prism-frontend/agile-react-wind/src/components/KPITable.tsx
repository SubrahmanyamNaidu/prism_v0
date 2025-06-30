
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { KPIResultItem } from '@/types/kpi';
import { getTableHeaders, formatCurrency, shouldFormatAsCurrency } from '@/utils/kpiUtils';
import { useKPIPagination } from '@/hooks/useKPIPagination';

interface KPITableProps {
  kpiName: string;
  results: KPIResultItem[];
  paginationHook: ReturnType<typeof useKPIPagination>;
}

const KPITable = ({ kpiName, results, paginationHook }: KPITableProps) => {
  const {
    initializePagination,
    updatePageSize,
    updateCurrentPage,
    getPaginatedData,
    getTotalPages,
    getCurrentState
  } = paginationHook;

  // Initialize pagination for this KPI
  initializePagination(kpiName);
  
  const currentState = getCurrentState(kpiName);
  const paginatedData = getPaginatedData(results, kpiName);
  const totalPages = getTotalPages(results.length, kpiName);
  const headers = getTableHeaders(results);

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-gray-800">
            {kpiName.replace(/_/g, ' ')} Details
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Items per page:</span>
            <Select
              value={currentState.pageSize.toString()}
              onValueChange={(value) => updatePageSize(kpiName, parseInt(value))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header} className="font-semibold">
                  {header.replace(/_/g, ' ').toUpperCase()}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item, index) => (
              <TableRow key={index}>
                {headers.map((header) => (
                  <TableCell key={header}>
                    {typeof item[header] === 'number' ? (
                      shouldFormatAsCurrency(header) ? (
                        formatCurrency(item[header])
                      ) : (
                        item[header].toString()
                      )
                    ) : (
                      item[header]?.toString() || '-'
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Showing {((currentState.currentPage - 1) * currentState.pageSize) + 1} to {Math.min(currentState.currentPage * currentState.pageSize, results.length)} of {results.length} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateCurrentPage(kpiName, currentState.currentPage - 1)}
                disabled={currentState.currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else {
                    const start = Math.max(1, currentState.currentPage - 2);
                    const end = Math.min(totalPages, start + 4);
                    pageNum = start + i;
                    if (pageNum > end) return null;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentState.currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateCurrentPage(kpiName, pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateCurrentPage(kpiName, currentState.currentPage + 1)}
                disabled={currentState.currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KPITable;
