import { useState, useCallback } from 'react';
import { TipoAjustInventarioService, TipoAjustInventarioApi } from '../services/tipoAjustInventarioService';

export function useTipoAjustInventario() {
    const [tipos, setTipos] = useState<TipoAjustInventarioApi[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchTipos = useCallback(async () => {
        setLoading(true);
        try {
            const data = await TipoAjustInventarioService.getAll();
            setTipos(data);
        } finally {
            setLoading(false);
        }
    }, []);

    return { tipos, loading, fetchTipos };
}
