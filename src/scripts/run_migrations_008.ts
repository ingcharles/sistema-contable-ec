
import { db } from '../shared/infrastructure/database/postgresql';
import fs from 'fs';
import path from 'path';

async function run() {
    const migrations = [
        'database/migrations/008_puntos_emision_asignaciones.sql',
        'database/migrations/008_seed_puntos_emision.sql'
    ];

    try {
        for (const migration of migrations) {
            const sqlPath = path.join(process.cwd(), migration);
            console.log(`Ejecutando migración: ${migration}...`);
            const sql = fs.readFileSync(sqlPath, 'utf-8');

            // Ejecutar todo el script como una Query simple
            await db.querySimple(sql);
            console.log(`Migración ${migration} ejecutada exitosamente.`);
        }
    } catch (error) {
        console.error('Error al ejecutar migraciones:', error);
    } finally {
        await db.close();
    }
}

run();
