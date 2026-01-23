/**
 * Domain Entities: Cajas (Box Management)
 *
 * Responsabilidades:
 * ✅ Define tipos de datos para el módulo de cajas
 * ✅ Interfaces de dominio: Caja, AperturaCaja, CierreCaja, MovimientoCaja
 * ✅ Props types para componentes
 */

export interface TipoOperacion {
    id: number;
    nombre: string;
    codigo: string;
}

export interface ComprobanteMovimiento {
    id: number;
    nombre_original: string;
    ruta_archivo: string;
    tipo_archivo: string;
    tamaño: number;
    created_at: string;
}

export interface Caja {
    id: number;
    nombre: string;
    ubicacion: string;
    monto_inicial_dia: number;
    activa: boolean;
}

export interface CierreCaja {
    id: number;
    monto_esperado: number;
    monto_real: number;
    diferencia: number;
    observaciones?: string;
    created_at: string;
}

export interface AperturaCaja {
    id: number;
    caja_id: number;
    user_id: number;
    fecha: string;
    monto_apertura: number;
    observaciones?: string;
    caja: Caja;
    cierre?: CierreCaja;
}

export interface MovimientoCaja {
    id: number;
    caja_id: number;
    numero_documento: string;
    observaciones: string;
    monto: number;
    fecha: string;
    created_at: string;
    tipo_operacion: TipoOperacion;
    comprobantes?: ComprobanteMovimiento[];
}

export interface AperturaHistorico {
    id: number;
    caja_id: number;
    caja_nombre: string;
    fecha_apertura: string;
    monto_apertura: number | string;
    observaciones_apertura: string;
    fecha_cierre: string | null;
    monto_esperado: number | string | null;
    monto_real: number | string | null;
    diferencia: number | string | null;
    observaciones_cierre: string | null;
    estado: 'Abierta' | 'Cerrada';
    estado_cierre: string | null;
}

export interface Usuario {
    id: number;
    name: string;
    email: string;
}

/**
 * Props para el componente Index de Cajas
 */
export interface CajasIndexProps {
    cajas: Caja[];
    cajaAbiertaHoy: AperturaCaja | null;
    movimientosHoy: MovimientoCaja[];
    totalMovimientos: number;
    historicoAperturas?: AperturaHistorico[];
    tiposOperacion?: TipoOperacion[];
    esVistaAdmin?: boolean; // ✅ NUEVO: Identificar si es vista admin
    usuarioDestino?: Usuario; // ✅ NUEVO: Usuario del cual se ve la caja
}
