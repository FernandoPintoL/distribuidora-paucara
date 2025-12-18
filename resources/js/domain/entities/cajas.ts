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
    descripcion: string;
    monto: number;
    fecha: string;
    created_at: string;
    tipo_operacion: TipoOperacion;
}

/**
 * Props para el componente Index de Cajas
 */
export interface CajasIndexProps {
    cajas: Caja[];
    cajaAbiertaHoy: AperturaCaja | null;
    movimientosHoy: MovimientoCaja[];
    totalMovimientos: number;
}
