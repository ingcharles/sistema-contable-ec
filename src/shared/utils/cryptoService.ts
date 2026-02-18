import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Obtiene la clave de encriptación del entorno
 * Si no existe, usa una clave por defecto (solo para desarrollo)
 */
function getKey(): Buffer {
    const key = process.env.SRI_ENCRYPTION_KEY || 'default-dev-key-32-chars-long!!';
    // Asegurar que sea de 32 bytes
    return Buffer.from(key.padEnd(32, '0').slice(0, 32), 'utf-8');
}

/**
 * Encripta un texto plano usando AES-256-CBC
 */
export function encrypt(text: string): string {
    if (!text) return '';
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

/**
 * Desencripta un texto encriptado con AES-256-CBC
 */
export function decrypt(hash: string): string {
    if (!hash) return '';
    const parts = hash.split(':');
    if (parts.length !== 2) return hash; // No está encriptado
    const iv = Buffer.from(parts[0], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
