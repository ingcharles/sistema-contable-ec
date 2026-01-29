'use client';

import { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';

interface AdminLayoutProps {
    children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <div className="flex min-h-[calc(100vh-5rem)]">
            <AdminSidebar />
            <div className="flex-1 bg-slate-50/50">
                <div className="max-w-6xl mx-auto p-6 lg:p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
