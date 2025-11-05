import { useState, useCallback } from 'react';
import { TipoMermaService } from '@/infrastructure/services/tipoMermaService';

export interface TipoMermaApi {
    id: number;
    clave: string;
    label: string;
    descripcion?: string;
    color?: string;
    bg_color?: string;
    text_color?: string;
    requiere_aprobacion?: boolean;
    activo?: boolean;
}

export function useTipoMermas() {
    const [tipos, setTipos] = useState<TipoMermaApi[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchTipos = useCallback(async () => {
        setLoading(true);
        try {
            const data = await TipoMermaService.getAll();
            setTipos(data);
        } finally {
            setLoading(false);
        }
    }, []);

    return { tipos, loading, fetchTipos };
}
