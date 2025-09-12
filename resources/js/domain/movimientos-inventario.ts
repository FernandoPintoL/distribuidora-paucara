// Domain: MovimientosInventario
import type { Id } from './shared';
import type { BaseEntity, BaseFormData } from './generic';

export interface MovimientoInventario extends BaseEntity {
    id: Id;
    stock_producto_id: Id;
    cantidad: number;
    fecha: string;
    observacion?: string | null;
    numero_documento?: string | null;
    cantidad_anterior: number;
    cantidad_posterior: number;
    tipo: MovimientoTipo;
    user_id?: Id;
    created_at?: string;
    updated_at?: string;

    // Relaciones
    stockProducto?: StockProducto;
    user?: User;
}

export interface StockProducto {
    id: Id;
    producto_id: Id;
    almacen_id: Id;
    cantidad: number;
    precio_promedio: number;
    stock_minimo: number;
    fecha_vencimiento?: string | null;
    lote?: string | null;

    // Relaciones
    producto?: Producto;
    almacen?: Almacen;
}

export interface Producto {
    id: Id;
    nombre: string;
    descripcion?: string | null;
    codigo_barras?: string | null;
    activo: boolean;
    categoria_id?: Id;

    // Relaciones
    categoria?: Categoria;
}

export interface Almacen {
    id: Id;
    nombre: string;
    direccion?: string | null;
    activo: boolean;
}

export interface Categoria {
    id: Id;
    nombre: string;
    descripcion?: string | null;
}

export interface User {
    id: Id;
    name: string;
    email: string;
}

export type MovimientoTipo =
    | 'ENTRADA_COMPRA'
    | 'ENTRADA_AJUSTE'
    | 'ENTRADA_DEVOLUCION'
    | 'TRANSFERENCIA_ENTRADA'
    | 'SALIDA_VENTA'
    | 'SALIDA_AJUSTE'
    | 'SALIDA_MERMA'
    | 'SALIDA_DEVOLUCION'
    | 'TRANSFERENCIA_SALIDA';

export interface MovimientoInventarioFormData extends BaseFormData {
    stock_producto_id: Id;
    cantidad: number;
    tipo: MovimientoTipo;
    observacion?: string;
    numero_documento?: string;
}

export interface MovimientoInventarioFilters {
    tipo?: MovimientoTipo | '';
    almacen_id?: Id | '';
    producto_id?: Id | '';
    fecha_inicio?: string;
    fecha_fin?: string;
    usuario_id?: Id | '';
    numero_documento?: string;
    page?: number;
    per_page?: number;
}

export const TIPOS_MOVIMIENTO: Record<MovimientoTipo, {
    label: string;
    color: string;
    icon: string;
    categoria: 'entrada' | 'salida' | 'transferencia';
}> = {
    ENTRADA_COMPRA: {
        label: 'Entrada por Compra',
        color: 'text-green-800 bg-green-100 dark:bg-green-900 dark:text-green-200',
        icon: '🛒',
        categoria: 'entrada'
    },
    ENTRADA_AJUSTE: {
        label: 'Entrada por Ajuste',
        color: 'text-blue-800 bg-blue-100 dark:bg-blue-900 dark:text-blue-200',
        icon: '⚖️',
        categoria: 'entrada'
    },
    ENTRADA_DEVOLUCION: {
        label: 'Entrada por Devolución',
        color: 'text-purple-800 bg-purple-100 dark:bg-purple-900 dark:text-purple-200',
        icon: '↩️',
        categoria: 'entrada'
    },
    TRANSFERENCIA_ENTRADA: {
        label: 'Entrada por Transferencia',
        color: 'text-indigo-800 bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-200',
        icon: '📥',
        categoria: 'transferencia'
    },
    SALIDA_VENTA: {
        label: 'Salida por Venta',
        color: 'text-red-800 bg-red-100 dark:bg-red-900 dark:text-red-200',
        icon: '💰',
        categoria: 'salida'
    },
    SALIDA_AJUSTE: {
        label: 'Salida por Ajuste',
        color: 'text-orange-800 bg-orange-100 dark:bg-orange-900 dark:text-orange-200',
        icon: '📉',
        categoria: 'salida'
    },
    SALIDA_MERMA: {
        label: 'Salida por Merma',
        color: 'text-yellow-800 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200',
        icon: '⚠️',
        categoria: 'salida'
    },
    SALIDA_DEVOLUCION: {
        label: 'Salida por Devolución',
        color: 'text-pink-800 bg-pink-100 dark:bg-pink-900 dark:text-pink-200',
        icon: '↪️',
        categoria: 'salida'
    },
    TRANSFERENCIA_SALIDA: {
        label: 'Salida por Transferencia',
        color: 'text-cyan-800 bg-cyan-100 dark:bg-cyan-900 dark:text-cyan-200',
        icon: '📤',
        categoria: 'transferencia'
    }
};

export const CATEGORIAS_MOVIMIENTO = {
    entrada: {
        label: 'Entradas',
        color: 'text-green-600',
        icon: '⬆️'
    },
    salida: {
        label: 'Salidas',
        color: 'text-red-600',
        icon: '⬇️'
    },
    transferencia: {
        label: 'Transferencias',
        color: 'text-blue-600',
        icon: '🔄'
    }
} as const;
