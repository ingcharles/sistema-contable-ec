import { Pool, QueryResult, QueryResultRow } from 'pg';

/**
 * Cliente singleton para PostgreSQL
 * Maneja el pool de conexiones y ejecuta queries con contexto de seguridad
 */
class PostgreSQLClient {
    private static instance: PostgreSQLClient;
    private pool: Pool;

    private constructor() {
        // Validar variables de entorno requeridas
        const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'] as const;
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                throw new Error(`Variable de entorno ${envVar} no está definida. Configúrela en el archivo .env`);
            }
        }

        this.pool = new Pool({
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT || '5435'),
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            max: 20, // máximo de conexiones en el pool
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        this.pool.on('error', (err) => {
            console.error('Error inesperado en el pool de PostgreSQL:', err);
        });
    }

    public static getInstance(): PostgreSQLClient {
        if (!PostgreSQLClient.instance) {
            PostgreSQLClient.instance = new PostgreSQLClient();
        }
        return PostgreSQLClient.instance;
    }

    /**
     * Ejecuta un query con contexto de empresa y usuario
     * Automáticamente establece app.current_user_id y app.current_empresa_id
     */
    public async query<T extends QueryResultRow = any>(
        config: any,
        context: { empresaId: string | null; usuarioId: string | null }
    ): Promise<QueryResult<T>> {
        const client = await this.pool.connect();
        try {
            // Establecer contexto de sesión para auditoría
            await client.query(
                `SELECT set_config('app.current_user_id', $1, false), 
                        set_config('app.current_empresa_id', $2, false)`,
                [context.usuarioId, context.empresaId]
            );

            // Ejecutar query principal
            const result = await client.query(config);
            return result as QueryResult<T>;
        } finally {
            client.release();
        }
    }

    /**
     * Ejecuta un query simple sin contexto (para consultas de sistema)
     */
    public async querySimple<T extends QueryResultRow = any>(config: any): Promise<QueryResult<T>> {
        const result = await this.pool.query(config);
        return result as QueryResult<T>;
    }

    /**
     * Ejecuta múltiples queries dentro de una transacción
     */
    public async transaction<T>(
        callback: (client: any) => Promise<T>,
        context: { empresaId: string; usuarioId: string }
    ): Promise<T> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Establecer contexto
            await client.query(
                `SELECT set_config('app.current_user_id', $1, false), 
                        set_config('app.current_empresa_id', $2, false)`,
                [context.usuarioId, context.empresaId]
            );

            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Cierra el pool de conexiones (útil para testing o shutdown)
     */
    public async close(): Promise<void> {
        await this.pool.end();
    }
}

export const db = PostgreSQLClient.getInstance();
