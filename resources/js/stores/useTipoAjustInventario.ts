import { useState, useCallback } from 'react';
import { TipoAjustInventarioService, TipoAjustInventarioApi } from '@/infrastructure/services/tipoAjustInventarioService';

export function useTipoAjustInventario() {
    const [tipos, setTipos] = useState<TipoAjustInventarioApi[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTipos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await TipoAjustInventarioService.getAll();
            setTipos(data);
        } catch (err) {
            setError('Error al cargar los tipos de ajuste');
            console.error('Error fetching tipos:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    return { tipos, loading, error, fetchTipos };
}
