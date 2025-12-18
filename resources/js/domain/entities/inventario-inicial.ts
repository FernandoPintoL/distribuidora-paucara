/**
 * Domain: Inventario Inicial
 *
 * Tipos y entidades para la carga inicial de inventario
 */

import type { Producto } from './productos';
import type { Almacen } from './almacenes';
import type { Id } from './shared';

// Re-export domain types for convenience
export type { Producto, Almacen };

export interface TipoAjuste {
    id: Id;
    clave: string;
    label: string;
    descripcion: string;
}

export interface InventarioItem {
    producto_id: number | '';
    almacen_id: number | '';
    cantidad: number | '';
    lote?: string;
    fecha_vencimiento?: string;
    observaciones?: string;
}

export interface CargarInventarioInicialPayload {
    items: InventarioItem[];
}

export interface InventarioInicialPageProps {
    productos: Producto[];
    almacenes: Almacen[];
    tipoInventarioInicial: TipoAjuste;
}
