'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConfiguracionPage() {
    const router = useRouter();

    useEffect(() => {
        router.push('/configuracion/empresa');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sri-blue"></div>
            <span className="ml-3 text-slate-500">Redireccionando a configuración de empresa...</span>
        </div>
    );
}
