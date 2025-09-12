import { useState, useCallback } from 'react';

interface SearchOption {
    value: string | number;
    label: string;
    description?: string;
    codigos_barras?: string;
}

interface ApiItem {
    id: string | number;
    nombre: string;
    [key: string]: unknown;
}

interface ProveedorItem extends ApiItem {
    email?: string;
    telefono?: string;
}

interface ProductoItem extends ApiItem {
    codigo: string;
    codigos_barras?: string;
}

interface UseApiSearchOptions {
    endpoint: string;
    mapResults?: (item: ApiItem) => SearchOption;
    minQueryLength?: number;
}

export function useApiSearch({
    endpoint,
    mapResults = (item) => ({ value: item.id, label: item.nombre }),
    minQueryLength = 2
}: UseApiSearchOptions) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const search = useCallback(async (query: string): Promise<SearchOption[]> => {
        if (!query || query.length < minQueryLength) {
            return [];
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${endpoint}?q=${encodeURIComponent(query)}&limite=10`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success && Array.isArray(data.data)) {
                return data.data.map(mapResults);
            } else {
                throw new Error('Formato de respuesta inválido');
            }
        } catch (error) {
            console.error('Error en búsqueda:', error);
            setError(error instanceof Error ? error.message : 'Error desconocido');
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [endpoint, mapResults, minQueryLength]);

    return {
        search,
        isLoading,
        error,
        clearError: () => setError(null)
    };
}

// Hooks específicos para cada entidad
export function useProveedorSearch() {
    return useApiSearch({
        endpoint: '/api/proveedores/buscar',
        mapResults: (proveedor) => {
            const prov = proveedor as ProveedorItem;
            return {
                value: prov.id,
                label: prov.nombre,
                description: prov.email ? `Email: ${prov.email}` :
                    prov.telefono ? `Tel: ${prov.telefono}` : undefined,
            };
        },
    });
}

export function useProductoSearch() {
    return useApiSearch({
        endpoint: '/api/productos/buscar',
        mapResults: (producto) => {
            const prod = producto as ProductoItem;
            return {
                value: prod.id,
                label: prod.nombre,
                description: `Código: ${prod.codigo}`,
                codigos_barras: prod.codigos_barras,
            };
        },
    });
}