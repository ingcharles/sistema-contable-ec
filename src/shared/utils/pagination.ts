export interface PaginationParams {
    page: number;
    limit: number;
    offset: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

/**
 * Extrae parámetros de paginación de la URL
 */
export function extractPaginationParams(url: URL): PaginationParams {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Validaciones
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100); // máximo 100 items por página

    return {
        page: validPage,
        limit: validLimit,
        offset: (validPage - 1) * validLimit
    };
}

/**
 * Construye una respuesta paginada
 */
export function buildPaginatedResponse<T>(
    data: T[],
    totalItems: number,
    params: PaginationParams
): PaginatedResponse<T> {
    const totalPages = Math.ceil(totalItems / params.limit);

    return {
        data,
        pagination: {
            currentPage: params.page,
            totalPages,
            totalItems,
            itemsPerPage: params.limit,
            hasNextPage: params.page < totalPages,
            hasPrevPage: params.page > 1
        }
    };
}

/**
 * Helper para generar query SQL de paginación
 */
export function getPaginationSQL(params: PaginationParams): string {
    return `LIMIT ${params.limit} OFFSET ${params.offset}`;
}
