'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { Button } from './Button';

export interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (row: T) => React.ReactNode;
    className?: string;
    sortable?: boolean;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    itemsPerPage?: number;
    searchable?: boolean;
    searchKeys?: (keyof T)[];
    searchPlaceholder?: string;
    onSearch?: (term: string) => void;
    actions?: React.ReactNode;
    emptyMessage?: string;
}

export function DataTable<T extends { id: string | number }>({
    data,
    columns,
    itemsPerPage = 10,
    searchable = false,
    searchKeys,
    searchPlaceholder = "Buscar...",
    onSearch,
    actions,
    emptyMessage = "No se encontraron registros."
}: DataTableProps<T>) {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof T | null; direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc',
    });

    // Filter
    const filteredData = React.useMemo(() => {
        if (!searchTerm) return data;
        const lowerTerm = searchTerm.toLowerCase();
        return data.filter((item) => {
            if (searchKeys && searchKeys.length > 0) {
                return searchKeys.some(key =>
                    String(item[key]).toLowerCase().includes(lowerTerm)
                );
            }
            return Object.values(item as any).some((val) =>
                String(val).toLowerCase().includes(lowerTerm)
            );
        });
    }, [data, searchTerm, searchKeys]);

    // Sort
    const sortedData = React.useMemo(() => {
        if (!sortConfig.key) return filteredData;
        return [...filteredData].sort((a, b) => {
            const aValue = a[sortConfig.key!];
            const bValue = b[sortConfig.key!];

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    // Pagination
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const paginatedData = sortedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSort = (key: keyof T) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        setCurrentPage(1);
        if (onSearch) onSearch(term);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Header / Toolbar */}
            {(searchable || actions) && (
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
                    {searchable ? (
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={handleSearch}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-sri-blue/20 outline-none transition-all"
                            />
                        </div>
                    ) : <div />}
                    {actions && <div className="flex gap-2">{actions}</div>}
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={`px-6 py-4 whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:bg-slate-100' : ''} ${col.className || ''}`}
                                    onClick={() => col.sortable && col.accessorKey && handleSort(col.accessorKey)}
                                >
                                    <div className="flex items-center gap-2">
                                        {col.header}
                                        {col.sortable && sortConfig.key === col.accessorKey && (
                                            sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                                        )}
                                        {col.sortable && sortConfig.key !== col.accessorKey && (
                                            <ArrowUpDown size={14} className="text-slate-300" />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row) => (
                                <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                                    {columns.map((col, idx) => (
                                        <td key={idx} className={`px-6 py-4 ${col.className || ''}`}>
                                            {col.cell ? col.cell(row) : (col.accessorKey ? String(row[col.accessorKey]) : '')}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400">
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
                    <div className="text-xs text-slate-500">
                        Mostrando <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-bold">{Math.min(currentPage * itemsPerPage, sortedData.length)}</span> de <span className="font-bold">{sortedData.length}</span> registros
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className="h-8 w-8 p-0 flex items-center justify-center"
                        >
                            <ChevronLeft size={16} />
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${currentPage === page
                                        ? 'bg-sri-blue text-white shadow-sm'
                                        : 'text-slate-500 hover:bg-slate-100'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className="h-8 w-8 p-0 flex items-center justify-center"
                        >
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
