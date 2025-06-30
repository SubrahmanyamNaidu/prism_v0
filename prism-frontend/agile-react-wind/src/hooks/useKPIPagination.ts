
import { useState } from 'react';
import { PaginationState, PaginationStates } from '@/types/kpi';

export const useKPIPagination = () => {
  const [paginationStates, setPaginationStates] = useState<PaginationStates>({});

  const initializePagination = (kpiName: string) => {
    if (!paginationStates[kpiName]) {
      setPaginationStates(prev => ({
        ...prev,
        [kpiName]: { currentPage: 1, pageSize: 10 }
      }));
    }
  };

  const updatePageSize = (kpiName: string, newSize: number) => {
    setPaginationStates(prev => ({
      ...prev,
      [kpiName]: { currentPage: 1, pageSize: newSize }
    }));
  };

  const updateCurrentPage = (kpiName: string, newPage: number) => {
    setPaginationStates(prev => ({
      ...prev,
      [kpiName]: { ...prev[kpiName], currentPage: newPage }
    }));
  };

  const getPaginatedData = (data: any[], kpiName: string) => {
    const state = paginationStates[kpiName] || { currentPage: 1, pageSize: 10 };
    const startIndex = (state.currentPage - 1) * state.pageSize;
    const endIndex = startIndex + state.pageSize;
    return data.slice(startIndex, endIndex);
  };

  const getTotalPages = (dataLength: number, kpiName: string): number => {
    const state = paginationStates[kpiName] || { currentPage: 1, pageSize: 10 };
    return Math.ceil(dataLength / state.pageSize);
  };

  const getCurrentState = (kpiName: string): PaginationState => {
    return paginationStates[kpiName] || { currentPage: 1, pageSize: 10 };
  };

  return {
    paginationStates,
    initializePagination,
    updatePageSize,
    updateCurrentPage,
    getPaginatedData,
    getTotalPages,
    getCurrentState
  };
};
