import type { Metadata } from 'next';
import '../styles/globals.css';
import { AuthProvider } from '@/shared/context/AuthContext';
import { EmpresaProvider } from '@/shared/context/EmpresaContext';

export const metadata: Metadata = {
    title: 'EcuContable Pro - Sistema Contable Ecuador',
    description: 'Sistema contable multiempresa para Ecuador con cumplimiento SRI',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es">
            <body>
                <AuthProvider>
                    <EmpresaProvider>
                        {children}
                    </EmpresaProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
