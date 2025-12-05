import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;
export type SortableField = string;

export interface UseTableSortOptions<T> {
  data: T[];
  defaultSortField?: SortableField;
  defaultSortDirection?: SortDirection;
  getValue?: (item: T, field: SortableField) => any;
}

export interface UseTableSortReturn<T> {
  sortField: SortableField | null;
  sortDirection: SortDirection;
  sortedData: T[];
  handleSort: (field: SortableField) => void;
  SortIcon: React.FC<{ field: SortableField }>;
  SortableHeader: React.FC<{ field: SortableField; children: React.ReactNode; className?: string }>;
}

/**
 * Custom hook for table sorting functionality
 */
export function useTableSort<T>({
  data,
  defaultSortField,
  defaultSortDirection = 'asc',
  getValue,
}: UseTableSortOptions<T>): UseTableSortReturn<T> {
  const [sortField, setSortField] = useState<SortableField | null>(defaultSortField || null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);

  const handleSort = (field: SortableField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (getValue) {
        aValue = getValue(a, sortField);
        bValue = getValue(b, sortField);
      } else {
        // Default: access field directly
        aValue = (a as any)[sortField];
        bValue = (b as any)[sortField];
      }

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Handle 'N/A' string values
      if (aValue === 'N/A' && bValue !== 'N/A') return 1;
      if (aValue !== 'N/A' && bValue === 'N/A') return -1;
      if (aValue === 'N/A' && bValue === 'N/A') return 0;

      // Handle different types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Convert to string for comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      const comparison = aStr.localeCompare(bStr);
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortField, sortDirection, getValue]);

  const SortIcon = ({ field }: { field: SortableField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1 text-indigo-600" />
      : <ArrowDown className="w-4 h-4 ml-1 text-indigo-600" />;
  };

  const SortableHeader: React.FC<{ field: SortableField; children: React.ReactNode; className?: string }> = ({ 
    field, 
    children, 
    className = '' 
  }) => {
    return (
      <th 
        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 select-none ${className}`}
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center">
          {children}
          <SortIcon field={field} />
        </div>
      </th>
    );
  };

  return {
    sortField,
    sortDirection,
    sortedData,
    handleSort,
    SortIcon,
    SortableHeader,
  };
}

