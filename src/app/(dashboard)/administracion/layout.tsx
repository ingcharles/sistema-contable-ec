import { AdminLayout } from '@/modules/administracion/ui/components/AdminLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
    return <AdminLayout>{children}</AdminLayout>;
}
