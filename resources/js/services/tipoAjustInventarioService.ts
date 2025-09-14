import axios from 'axios';

export interface TipoAjustInventarioApi {
    id: number;
    clave: string;
    label: string;
    descripcion?: string;
    color?: string;
    bg_color?: string;
    text_color?: string;
    activo?: boolean;
}

export const TipoAjustInventarioService = {
    async getAll(): Promise<TipoAjustInventarioApi[]> {
        const { data } = await axios.get('/api/tipos-ajuste-inventario');
        return data.data;
    },
    async create(payload: Partial<TipoAjustInventarioApi>) {
        const { data } = await axios.post('/api/tipos-ajuste-inventario', payload);
        return data.data;
    },
    async update(id: number, payload: Partial<TipoAjustInventarioApi>) {
        const { data } = await axios.put(`/api/tipos-ajuste-inventario/${id}`, payload);
        return data.data;
    },
    async remove(id: number) {
        await axios.delete(`/api/tipos-ajuste-inventario/${id}`);
    }
};
