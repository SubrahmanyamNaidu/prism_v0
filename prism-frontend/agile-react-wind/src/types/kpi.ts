
export interface KPIResultItem {
  sum?: number;
  average_amount?: number;
  payment_method?: string;
  product_id?: number;
  revenue_by_product?: number;
  [key: string]: any; // Allow for other dynamic properties
}

export interface KPIItem {
  name: string;
  result: KPIResultItem[];
}

export interface KPIResponse {
  success: boolean;
  message: string;
  kpis: KPIItem[] | {};
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
}

export interface PaginationStates {
  [key: string]: PaginationState;
}
