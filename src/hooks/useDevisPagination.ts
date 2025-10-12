import { useState, useMemo, useEffect } from 'react';
import { PAGINATION } from '@/utils/constants';

export const useDevisPagination = <T>(
  items: T[],
  itemsPerPage: number = PAGINATION.DEFAULT_ITEMS_PER_PAGE
) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination data
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = items.slice(startIndex, endIndex);

    return {
      totalPages,
      currentPage,
      startIndex,
      endIndex,
      paginatedItems,
      totalItems: items.length,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    };
  }, [items, currentPage, itemsPerPage]);

  // Reset to first page when items change
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  // Navigation functions
  const goToPage = (page: number) => {
    const maxPage = Math.max(1, paginationData.totalPages);
    setCurrentPage(Math.min(Math.max(1, page), maxPage));
  };

  const goToNextPage = () => {
    if (paginationData.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (paginationData.hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(paginationData.totalPages);
  };

  // Generate page numbers for pagination component
  const getPageNumbers = (maxVisible: number = PAGINATION.MAX_VISIBLE_PAGES) => {
    const { totalPages, currentPage } = paginationData;
    
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return {
    ...paginationData,
    
    // Navigation
    goToPage,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
    
    // Utils
    getPageNumbers,
  };
};
