
import { db } from '@/shared/infrastructure/database/postgresql';

export class PermissionService {
    /**
     * Calcula los permisos efectivos de un usuario basándose en:
     * 1. Permisos otorgados por sus Roles (seguridad.roles_permisos)
     * 2. Permisos permitidos por su Plan (seguridad.planes_permisos)
     * 
     * La lógica es INTERSECCIÓN: Un usuario solo tiene un permiso si su Rol lo tiene Y su Plan lo permite.
     */
    static async calculateEffectivePermissions(userId: string, planId?: string): Promise<string[]> {
        // 1. Obtener permisos de los Roles del usuario
        const rolePermissionsResult = await db.querySimple({
            text: `
                SELECT DISTINCT p.codigo
                FROM seguridad.permisos p
                JOIN seguridad.roles_permisos rp ON p.id = rp.permiso_id
                JOIN seguridad.usuarios_roles ur ON rp.rol_id = ur.rol_id
                WHERE ur.usuario_id = $1
            `,
            values: [userId]
        });

        const rolePermissions = rolePermissionsResult.rows.map(row => row.codigo);

        // Si no hay planId, asumimos que no hay restricciones de plan o que no tiene plan activo.
        // Pero en este sistema, todos deben tener un plan (aunque sea Gratuito).
        // Si no hay planId, devolvemos array vacío o solo roles? 
        // Política estricta: Sin plan = Sin permisos.
        if (!planId) {
            console.warn(`User ${userId} has no plan assigned. Returning empty permissions.`);
            return [];
        }

        // 2. Obtener permisos del Plan
        const planPermissionsResult = await db.querySimple({
            text: `
                SELECT DISTINCT p.codigo
                FROM seguridad.permisos p
                JOIN seguridad.planes_permisos pp ON p.id = pp.permiso_id
                WHERE pp.plan_id = $1
            `,
            values: [planId]
        });

        const planPermissions = planPermissionsResult.rows.map(row => row.codigo);

        // 3. Intersección (AND lógico)
        // El usuario tiene el permiso SI está en sus roles Y está en su plan.
        const effectivePermissions = rolePermissions.filter(permission =>
            planPermissions.includes(permission)
        );

        return effectivePermissions;
    }
}
