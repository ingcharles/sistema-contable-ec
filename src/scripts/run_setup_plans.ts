
import { db } from '../shared/infrastructure/database/postgresql';
import fs from 'fs';
import path from 'path';

async function run() {
    try {
        const sqlPath = path.join(process.cwd(), 'src', 'scripts', 'setup_plans.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');
        console.log('Ejecutando script SQL...');

        // Ejecutar todo el script como una Query simple
        await db.querySimple(sql);

        console.log('Script ejecutado exitosamente.');
    } catch (error) {
        console.error('Error al ejecutar script:', error);
    } finally {
        await db.close();
    }
}

run();
