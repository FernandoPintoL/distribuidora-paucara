import { useState, useCallback } from 'react';
import { EstadoMermaService } from '@/infrastructure/services/estadoMermaService';

export interface EstadoMermaApi {
    id: number;
    clave: string;
    label: string;
    color?: string;
    bg_color?: string;
    text_color?: string;
    actions?: string[];
    activo?: boolean;
}

export function useEstadoMermas() {
    const [estados, setEstados] = useState<EstadoMermaApi[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchEstados = useCallback(async () => {
        setLoading(true);
        try {
            const data = await EstadoMermaService.getAll();
            setEstados(data);
        } finally {
            setLoading(false);
        }
    }, []);

    return { estados, loading, fetchEstados };
}
