/**
 * Convierte un objeto con claves en snake_case a camelCase
 */
export function toCamelCase(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(v => toCamelCase(v));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce(
            (result, key) => ({
                ...result,
                [key.replace(/(_\w)/g, m => m[1].toUpperCase())]: toCamelCase(obj[key]),
            }),
            {},
        );
    }
    return obj;
}

/**
 * Convierte un objeto con claves en camelCase a snake_case
 */
export function toSnakeCase(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(v => toSnakeCase(v));
    } else if (obj !== null && obj.constructor === Object) {
        return Object.keys(obj).reduce(
            (result, key) => ({
                ...result,
                [key.replace(/[A-Z]/g, m => `_${m.toLowerCase()}`)]: toSnakeCase(obj[key]),
            }),
            {},
        );
    }
    return obj;
}
