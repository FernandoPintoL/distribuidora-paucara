/**
 * Domain Entities: Dashboard de Inventario
 *
 * Define todas las entidades y tipos relacionados con el dashboard
 * de inventario, separando la lógica de dominio de la presentación
 */

/**
 * Estadísticas del inventario
 */
export interface Estadisticas {
    total_productos: number;
    productos_stock_bajo: number;
    productos_proximos_vencer: number;
    productos_vencidos: number;
}

/**
 * Stock de productos por almacén (detalle de stock_productos)
 */
export interface StockPorAlmacen {
    id: number;
    producto_id: number;
    almacen_id: number;
    cantidad: number;
    cantidad_disponible: number;
    cantidad_reservada: number;
    precio_venta: number;
    producto_nombre: string;
    producto_codigo: string;
    producto_codigo_barra: string;
    producto_sku: string;
    almacen_nombre: string;
}

/**
 * Movimiento de inventario reciente
 */
export interface MovimientoReciente {
    id: number;
    tipo: 'entrada' | 'salida' | 'ajuste';
    cantidad: number;
    fecha: string;
    stockProducto: {
        producto: {
            nombre: string;
        };
        almacen: {
            nombre: string;
        };
    };
    user?: {
        name: string;
    };
}

/**
 * Producto con mayor cantidad de movimientos
 */
export interface ProductoMasMovido {
    producto_id: number;
    nombre_producto: string;
    total_movimientos: number;
}

/**
 * Props de la página del dashboard
 */
export interface DashboardPageProps {
    estadisticas: Estadisticas;
    stock_por_almacen: StockPorAlmacen[];
    movimientos_recientes: MovimientoReciente[];
    productos_mas_movidos: ProductoMasMovido[];
}

/**
 * Datos procesados del dashboard para la vista
 */
export interface DashboardData {
    estadisticas: Estadisticas;
    stockPorAlmacen: StockPorAlmacen[];
    movimientosRecientes: MovimientoReciente[];
    productosMasMovidos: ProductoMasMovido[];
}

/**
 * Constantes para el dashboard
 */
export const DASHBOARD_CONSTANTS = {
    ITEMS_MOVIMIENTOS_RECIENTES: 5,
    ITEMS_PRODUCTOS_MAS_MOVIDOS: 5,
    TIPOS_MOVIMIENTO: {
        ENTRADA: 'entrada',
        SALIDA: 'salida',
        AJUSTE: 'ajuste'
    } as const
} as const;
