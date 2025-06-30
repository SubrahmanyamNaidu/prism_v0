
import { KPIResultItem } from '@/types/kpi';

export const getNumericValue = (item: KPIResultItem): number => {
  if (item.sum !== undefined) return item.sum;
  if (item.average_amount !== undefined) return item.average_amount;
  if (item.revenue_by_product !== undefined) return item.revenue_by_product;
  
  // Look for any numeric property
  const numericKeys = Object.keys(item).filter(key => 
    typeof item[key] === 'number' && key !== 'product_id'
  );
  
  if (numericKeys.length > 0) {
    return item[numericKeys[0]];
  }
  
  return 0;
};

export const getDisplayLabel = (item: KPIResultItem, kpiName: string): string => {
  if (item.payment_method) return item.payment_method;
  if (item.product_id !== undefined) return `Product ${item.product_id}`;
  return kpiName.replace(/_/g, ' ');
};

export const getTableHeaders = (results: KPIResultItem[]): string[] => {
  const allKeys = new Set<string>();
  results.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });
  return Array.from(allKeys).sort();
};

export const formatCurrency = (value: number): string => {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const shouldFormatAsCurrency = (header: string): boolean => {
  return header.toLowerCase().includes('revenue') || 
         header.toLowerCase().includes('amount') || 
         header.toLowerCase().includes('sum');
};
