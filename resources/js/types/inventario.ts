// Tipos para el módulo de inventario

export interface Almacen {
    id: number;
    nombre: string;
    codigo?: string;
    activo: boolean;
}

export interface Vehiculo {
    id: number;
    placa: string;
    modelo: string;
    chofer?: {
        id: number;
        user: {
            name: string;
        };
    };
}

export interface Chofer {
    id: number;
    user: {
        id: number;
        name: string;
    };
    telefono?: string;
    licencia?: string;
}

export interface Producto {
    id: number;
    nombre: string;
    codigo?: string;
    stock_actual?: number;
    categoria?: {
        id: number;
        nombre: string;
    };
}

export interface ProductoInventario {
    id: number;
    nombre: string;
    codigo?: string;
    stock_actual?: number;
    categoria?: {
        id: number;
        nombre: string;
    };
}

// === SISTEMA UNIFICADO DE MOVIMIENTOS ===

export type TipoMovimiento =
    | 'ENTRADA'      // Compras, devoluciones de clientes
    | 'SALIDA'       // Ventas, devoluciones a proveedores  
    | 'AJUSTE'       // Ajustes manuales de inventario
    | 'TRANSFERENCIA' // Transferencias entre almacenes
    | 'MERMA'        // Pérdidas, deterioros, vencimientos
    | 'PRODUCCION'   // Entrada por producción (futuro)
    | 'DEVOLUCION';  // Devoluciones internas (futuro)

export type SubtipoMovimiento =
    // Subtipos para ENTRADA
    | 'COMPRA'
    | 'DEVOLUCION_CLIENTE'
    | 'AJUSTE_POSITIVO'
    // Subtipos para SALIDA  
    | 'VENTA'
    | 'DEVOLUCION_PROVEEDOR'
    | 'AJUSTE_NEGATIVO'
    // Subtipos para TRANSFERENCIA
    | 'TRANSFERENCIA_SALIDA'
    | 'TRANSFERENCIA_ENTRADA'
    // Subtipos para MERMA
    | 'MERMA_VENCIMIENTO'
    | 'MERMA_DETERIORO'
    | 'MERMA_ROBO'
    | 'MERMA_PERDIDA'
    | 'MERMA_DANO'
    | 'MERMA_OTROS';

export interface MovimientoUnificado {
    id: number;
    tipo: TipoMovimiento;
    tipo_ajuste_id?: number;
    subtipo: SubtipoMovimiento;
    numero_documento?: string;
    fecha: string;
    hora: string;

    // Referencias a documentos origen
    referencia_id?: number;
    referencia_tipo?: 'transferencia' | 'merma' | 'compra' | 'venta' | 'ajuste';
    numero_referencia?: string;

    // Información del producto y stock
    producto_id: number;
    producto: Producto;
    almacen_id: number;
    almacen: Almacen;
    cantidad: number;
    cantidad_anterior: number;
    cantidad_nueva: number;

    // Información financiera
    costo_unitario?: number;
    costo_total?: number;
    precio_venta?: number;
    valor_total?: number;

    // Información adicional
    lote?: string;
    fecha_vencimiento?: string;
    motivo: string;
    observaciones?: string;

    // Usuario responsable
    usuario_id: number;
    usuario: {
        id: number;
        name: string;
        email?: string;
    };

    // Información de transferencias
    almacen_origen_id?: number;
    almacen_origen?: Almacen;
    almacen_destino_id?: number;
    almacen_destino?: Almacen;

    // Estado y aprobaciones
    estado?: 'PENDIENTE' | 'PROCESADO' | 'CANCELADO' | 'APROBADO' | 'RECHAZADO';
    requiere_aprobacion?: boolean;
    aprobado_por_id?: number;
    aprobado_por?: {
        id: number;
        name: string;
    };
    fecha_aprobacion?: string;

    // Metadatos
    created_at: string;
    updated_at: string;
}

export interface ConfiguracionTipoMovimiento {
    tipo: TipoMovimiento;
    label: string;
    descripcion: string;
    icon: string;
    color: string;
    bgColor: string;
    textColor: string;
    afecta_stock: 'POSITIVO' | 'NEGATIVO' | 'NEUTRO';
    requiere_aprobacion: boolean;
    permite_edicion: boolean;
    subtipos: SubtipoMovimiento[];
}

export const CONFIGURACION_MOVIMIENTOS: Record<TipoMovimiento, ConfiguracionTipoMovimiento> = {
    ENTRADA: {
        tipo: 'ENTRADA',
        label: 'Entrada',
        descripcion: 'Incrementa el stock del almacén',
        icon: 'ArrowDown',
        color: 'green',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        textColor: 'text-green-800 dark:text-green-300',
        afecta_stock: 'POSITIVO',
        requiere_aprobacion: false,
        permite_edicion: true,
        subtipos: ['COMPRA', 'DEVOLUCION_CLIENTE', 'AJUSTE_POSITIVO']
    },
    SALIDA: {
        tipo: 'SALIDA',
        label: 'Salida',
        descripcion: 'Reduce el stock del almacén',
        icon: 'ArrowUp',
        color: 'red',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        textColor: 'text-red-800 dark:text-red-300',
        afecta_stock: 'NEGATIVO',
        requiere_aprobacion: false,
        permite_edicion: true,
        subtipos: ['VENTA', 'DEVOLUCION_PROVEEDOR', 'AJUSTE_NEGATIVO']
    },
    AJUSTE: {
        tipo: 'AJUSTE',
        label: 'Ajuste',
        descripcion: 'Corrección manual del inventario',
        icon: 'Settings',
        color: 'blue',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        textColor: 'text-blue-800 dark:text-blue-300',
        afecta_stock: 'NEUTRO',
        requiere_aprobacion: true,
        permite_edicion: false,
        subtipos: ['AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO']
    },
    TRANSFERENCIA: {
        tipo: 'TRANSFERENCIA',
        label: 'Transferencia',
        descripcion: 'Movimiento entre almacenes',
        icon: 'ArrowLeftRight',
        color: 'purple',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20',
        textColor: 'text-purple-800 dark:text-purple-300',
        afecta_stock: 'NEUTRO',
        requiere_aprobacion: false,
        permite_edicion: true,
        subtipos: ['TRANSFERENCIA_SALIDA', 'TRANSFERENCIA_ENTRADA']
    },
    MERMA: {
        tipo: 'MERMA',
        label: 'Merma',
        descripcion: 'Pérdida de productos',
        icon: 'AlertTriangle',
        color: 'orange',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20',
        textColor: 'text-orange-800 dark:text-orange-300',
        afecta_stock: 'NEGATIVO',
        requiere_aprobacion: true,
        permite_edicion: false,
        subtipos: ['MERMA_VENCIMIENTO', 'MERMA_DETERIORO', 'MERMA_ROBO', 'MERMA_PERDIDA', 'MERMA_DANO', 'MERMA_OTROS']
    },
    PRODUCCION: {
        tipo: 'PRODUCCION',
        label: 'Producción',
        descripcion: 'Entrada por procesos de producción',
        icon: 'Factory',
        color: 'indigo',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
        textColor: 'text-indigo-800 dark:text-indigo-300',
        afecta_stock: 'POSITIVO',
        requiere_aprobacion: false,
        permite_edicion: true,
        subtipos: []
    },
    DEVOLUCION: {
        tipo: 'DEVOLUCION',
        label: 'Devolución',
        descripcion: 'Devoluciones internas',
        icon: 'Undo',
        color: 'gray',
        bgColor: 'bg-gray-100 dark:bg-gray-900/20',
        textColor: 'text-gray-800 dark:text-gray-300',
        afecta_stock: 'NEUTRO',
        requiere_aprobacion: true,
        permite_edicion: true,
        subtipos: []
    }
};

export type EstadoMovimiento = 'PENDIENTE' | 'PROCESADO' | 'CANCELADO' | 'APROBADO' | 'RECHAZADO';

export interface FiltrosMovimientos {
    // Filtros básicos
    tipo?: TipoMovimiento;
    tipos?: TipoMovimiento[];
    tipo_ajuste_id?: number;
    subtipo?: SubtipoMovimiento;
    subtipos?: SubtipoMovimiento[];

    // Filtros de ubicación
    almacen_id?: number;
    almacenes?: number[];
    almacen_origen_id?: number;
    almacen_destino_id?: number;

    // Filtros de producto y usuario
    producto_id?: number;
    productos?: number[];
    usuario_id?: number;
    usuarios?: number[];

    // Filtros de estado y tiempo
    estado?: EstadoMovimiento;
    estados?: EstadoMovimiento[];
    fecha_desde?: string;
    fecha_hasta?: string;

    // Filtros de búsqueda
    search?: string;
    busqueda?: string;
    numero_referencia?: string;
    lote?: string;

    // Filtros de cantidad y valor
    cantidad_min?: number;
    cantidad_max?: number;
    valor_min?: number;
    valor_max?: number;

    // Filtros booleanos
    requiere_aprobacion?: boolean;
    solo_pendientes?: boolean;
    solo_mermas?: boolean;
}

export interface EstadisticasMovimientos {
    total_movimientos: number;
    total_entradas: number;
    total_salidas: number;
    total_transferencias: number;
    total_mermas: number;
    total_ajustes: number;
    valor_total_entradas: number;
    valor_total_salidas: number;
    valor_total_mermas: number;
    productos_afectados: number;
    almacenes_activos: number;
    movimientos_pendientes: number;
    tendencia_semanal: {
        fecha: string;
        entradas: number;
        salidas: number;
        transferencias: number;
        mermas: number;
    }[];
}

export interface StockProducto {
    id: number;
    producto_id: number;
    almacen_id: number;
    cantidad: number;
    stock_minimo: number;
    fecha_vencimiento?: string;
    lote?: string;
    producto: Producto;
    almacen: Almacen;
}

export interface DetalleTransferencia {
    id: number;
    transferencia_id: number;
    producto_id: number;
    cantidad: number;
    cantidad_recibida?: number;
    lote?: string;
    fecha_vencimiento?: string;
    observaciones?: string;
    producto: Producto;
    stock_producto?: StockProducto;
}

export interface TransferenciaInventario {
    id: number;
    numero: string;
    fecha: string;
    almacen_origen_id: number;
    almacen_destino_id: number;
    vehiculo_id?: number;
    chofer_id?: number;
    usuario_id: number;
    fecha_envio?: string;
    fecha_recepcion?: string;
    estado: EstadoTransferencia;
    observaciones?: string;
    total_productos: number;
    total_cantidad: number;
    motivo_cancelacion?: string;

    // Relaciones
    almacen_origen: Almacen;
    almacen_destino: Almacen;
    vehiculo?: Vehiculo;
    chofer?: Chofer;
    creado_por: {
        id: number;
        name: string;
    };
    detalles: DetalleTransferencia[];
}

export type EstadoTransferencia = 'BORRADOR' | 'ENVIADO' | 'RECIBIDO' | 'CANCELADO';

export interface EstadoConfig {
    label: string;
    color: string;
    bgColor: string;
    textColor: string;
    actions: string[];
}

export const ESTADOS_TRANSFERENCIA: Record<EstadoTransferencia, EstadoConfig> = {
    BORRADOR: {
        label: 'Borrador',
        color: 'gray',
        bgColor: 'bg-gray-100 dark:bg-gray-800',
        textColor: 'text-gray-800 dark:text-gray-200',
        actions: ['enviar', 'edit', 'cancelar']
    },
    ENVIADO: {
        label: 'Enviado',
        color: 'blue',
        bgColor: 'bg-blue-100 dark:bg-blue-800',
        textColor: 'text-blue-800 dark:text-blue-200',
        actions: ['recibir', 'cancelar']
    },
    RECIBIDO: {
        label: 'Recibido',
        color: 'green',
        bgColor: 'bg-green-100 dark:bg-green-800',
        textColor: 'text-green-800 dark:text-green-200',
        actions: ['view']
    },
    CANCELADO: {
        label: 'Cancelado',
        color: 'red',
        bgColor: 'bg-red-100 dark:bg-red-800',
        textColor: 'text-red-800 dark:text-red-200',
        actions: ['view']
    }
};

export interface FiltrosTransferencias {
    estado?: EstadoTransferencia;
    almacen_origen?: number;
    almacen_destino?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
    search?: string;
}

export interface NuevaTransferencia {
    almacen_origen_id: number;
    almacen_destino_id: number;
    vehiculo_id?: number;
    chofer_id?: number;
    observaciones?: string;
    detalles: {
        producto_id: number;
        cantidad: number;
        lote?: string;
        fecha_vencimiento?: string;
    }[];
}

// === TIPOS PARA MERMAS ===

export interface DetalleMerma {
    id: number;
    merma_id: number;
    producto_id: number;
    cantidad: number;
    costo_unitario?: number;
    costo_total?: number;
    lote?: string;
    fecha_vencimiento?: string;
    observaciones?: string;
    producto: Producto;
}

export interface MermaInventario {
    id: number;
    numero: string;
    fecha: string;
    almacen_id: number;
    tipo_merma: TipoMerma;
    motivo: string;
    observaciones?: string;
    total_productos: number;
    total_cantidad: number;
    total_costo?: number;
    usuario_id: number;
    estado: EstadoMerma;
    fecha_aprobacion?: string;
    aprobado_por_id?: number;

    // Relaciones
    almacen: Almacen;
    usuario: {
        id: number;
        name: string;
    };
    aprobado_por?: {
        id: number;
        name: string;
    };
    detalles: DetalleMerma[];
}

export type TipoMerma = 'VENCIMIENTO' | 'DETERIORO' | 'ROBO' | 'PERDIDA' | 'DANO' | 'OTROS';

export type EstadoMerma = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface TipoMermaConfig {
    label: string;
    descripcion: string;
    color: string;
    bgColor: string;
    textColor: string;
    requiere_aprobacion: boolean;
}

export const TIPOS_MERMA: Record<TipoMerma, TipoMermaConfig> = {
    VENCIMIENTO: {
        label: 'Vencimiento',
        descripcion: 'Productos que han superado su fecha de vencimiento',
        color: 'red',
        bgColor: 'bg-red-100 dark:bg-red-900/20',
        textColor: 'text-red-800 dark:text-red-300',
        requiere_aprobacion: false
    },
    DETERIORO: {
        label: 'Deterioro',
        descripcion: 'Productos que se han deteriorado durante el almacenamiento',
        color: 'orange',
        bgColor: 'bg-orange-100 dark:bg-orange-900/20',
        textColor: 'text-orange-800 dark:text-orange-300',
        requiere_aprobacion: true
    },
    ROBO: {
        label: 'Robo',
        descripcion: 'Productos faltantes por hurto o robo',
        color: 'purple',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20',
        textColor: 'text-purple-800 dark:text-purple-300',
        requiere_aprobacion: true
    },
    PERDIDA: {
        label: 'Pérdida',
        descripcion: 'Productos extraviados o perdidos',
        color: 'gray',
        bgColor: 'bg-gray-100 dark:bg-gray-900/20',
        textColor: 'text-gray-800 dark:text-gray-300',
        requiere_aprobacion: true
    },
    DANO: {
        label: 'Daño',
        descripcion: 'Productos dañados durante manipulación o transporte',
        color: 'yellow',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        textColor: 'text-yellow-800 dark:text-yellow-300',
        requiere_aprobacion: true
    },
    OTROS: {
        label: 'Otros',
        descripcion: 'Otros motivos no especificados',
        color: 'indigo',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
        textColor: 'text-indigo-800 dark:text-indigo-300',
        requiere_aprobacion: true
    }
};

export interface EstadoMermaConfig {
    label: string;
    color: string;
    bgColor: string;
    textColor: string;
    actions: string[];
}

export const ESTADOS_MERMA: Record<EstadoMerma, EstadoMermaConfig> = {
    PENDIENTE: {
        label: 'Pendiente',
        color: 'yellow',
        bgColor: 'bg-yellow-100 dark:bg-yellow-800',
        textColor: 'text-yellow-800 dark:text-yellow-200',
        actions: ['aprobar', 'rechazar', 'edit']
    },
    APROBADO: {
        label: 'Aprobado',
        color: 'green',
        bgColor: 'bg-green-100 dark:bg-green-800',
        textColor: 'text-green-800 dark:text-green-200',
        actions: ['view']
    },
    RECHAZADO: {
        label: 'Rechazado',
        color: 'red',
        bgColor: 'bg-red-100 dark:bg-red-800',
        textColor: 'text-red-800 dark:text-red-200',
        actions: ['view']
    }
};

export interface FiltrosMermas {
    tipo_merma?: TipoMerma;
    estado?: EstadoMerma;
    almacen_id?: number;
    fecha_desde?: string;
    fecha_hasta?: string;
    usuario_id?: number;
}

export interface NuevaMerma {
    almacen_id: number;
    tipo_merma: TipoMerma;
    motivo: string;
    observaciones?: string;
    detalles: {
        producto_id: number;
        cantidad: number;
        costo_unitario?: number;
        lote?: string;
        fecha_vencimiento?: string;
        observaciones?: string;
    }[];
}
