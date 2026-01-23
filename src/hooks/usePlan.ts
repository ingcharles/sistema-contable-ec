import { useAuth } from '@/shared/context/AuthContext';

export const usePlan = () => {
    const { user } = useAuth();
    // Como el plan se mezcla en el usuario en AuthContext, accedemos directamente
    const plan = user?.plan;
    const planStatus = user?.planStatus;

    /**
     * Verifica si una característica está permitida y devuelve su valor (límite) si aplica.
     */
    const checkFeature = (featureKey: string): { allowed: boolean; value?: number | boolean } => {
        if (!plan || !plan.features) {
            // Si no hay plan cargado, asumimos bloqueo por defecto
            return { allowed: false };
        }

        // Si el plan está expirado o suspendido, todo bloqueado excepto acceso básico
        if (planStatus !== 'ACTIVE') {
            return { allowed: false };
        }

        const feature = plan.features.find(f => f.featureKey === featureKey);

        if (!feature) {
            return { allowed: false };
        }

        // Si es booleano, dovolver el valor tal cual
        if (feature.valueType === 'BOOLEANO' || feature.valueType === 'BOOLEAN') {
            return { allowed: !!feature.valueBool, value: feature.valueBool || false };
        }

        // Si es numérico (límite), devolver permitido (la validación de cantidad se hace aparte)
        if (feature.valueType === 'NUMERO' || feature.valueType === 'NUMBER') {
            return { allowed: true, value: feature.valueNumber || 0 };
        }

        return { allowed: false };
    };

    /**
     * Verifica si se ha alcanzado un límite numérico (ej: Documentos Mensuales)
     */
    const checkLimit = (featureKey: string, currentValue: number): boolean => {
        const feature = checkFeature(featureKey);
        if (!feature.allowed) return false;

        // Si el valor es null o infinito (lógica de negocio para ilimitado, ej: -1 o 999999)
        const limit = feature.value as number;
        if (limit > 900000) return true; // Ilimitado

        return currentValue < limit;
    };

    return {
        plan,
        planStatus,
        checkFeature,
        checkLimit,
        isPro: plan?.codigo === 'PROFESIONAL' || plan?.codigo === 'EMPRESARIAL',
        isEnterprise: plan?.codigo === 'EMPRESARIAL',
        nombrePlan: plan?.nombre || 'Sin Plan',
    };
};
