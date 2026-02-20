import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/presentation/components/ui/table';
import { Badge } from '@/presentation/components/ui/badge';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import MovimientoDetallesModal from './MovimientoDetallesModal';

interface MovimientoInventario {
    id: number;
    numero: string;
    numero_documento?: string;  // ✅ NUEVO: Referencia a venta/proforma/etc (VEN20260212-0001)
    fecha: string;
    created_at: string;  // ✅ NUEVO (2026-02-11): Fecha de creación del registro
    tipo: string;
    producto: {
        id?: number;
        nombre: string;
        codigo: string;
        sku?: string;
    };
    almacen: {
        nombre: string;
    };
    stock_producto_id?: number;  // ✅ NUEVO (2026-02-12): ID del stock
    lote?: string;  // ✅ NUEVO (2026-02-12): Número de lote
    cantidad: number;
    cantidad_anterior: number;  // ✅ NUEVO: Cantidad antes del movimiento
    cantidad_posterior: number;  // ✅ NUEVO: Cantidad después del movimiento
    motivo: string;
    usuario: {
        name: string;
        rol?: string;
    };
    // ✅ NUEVO (2026-02-18): Información de conversiones de unidades
    es_conversion_aplicada?: boolean;
    cantidad_solicitada?: number;
    factor_conversion?: number;
    unidad_venta_nombre?: string;
    unidad_base_nombre?: string;  // ✅ NUEVO: Nombre de la unidad base (almacenamiento)
}

interface PaginationInfo {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface MovimientosTableProps {
    movimientos: MovimientoInventario[];
    isLoading?: boolean;
    pagination?: PaginationInfo;
    onPageChange?: (page: number) => void;
}

const MovimientosTable: React.FC<MovimientosTableProps> = ({
    movimientos = [],
    isLoading = false,
    pagination,
    onPageChange
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMovimiento, setSelectedMovimiento] = useState<MovimientoInventario | null>(null);
    const getTipoColor = (tipo: string) => {
        const colors: Record<string, string> = {
            'ENTRADA': 'bg-green-100 text-green-800',
            'SALIDA': 'bg-red-100 text-red-800',
            'TRANSFERENCIA_ENTRADA': 'bg-blue-100 text-blue-800',
            'TRANSFERENCIA_SALIDA': 'bg-yellow-100 text-yellow-800',
            'AJUSTE': 'bg-purple-100 text-purple-800',
            'RESERVA': 'bg-orange-100 text-orange-800',  // ✅ Color para reservas genéricas
            // ✅ NUEVO (2026-02-12): Colores para tipos de reservas de proforma
            'RESERVA_PROFORMA': 'bg-indigo-100 text-indigo-800',  // Reserva creada
            'LIBERACION_RESERVA': 'bg-amber-100 text-amber-800',  // Reserva liberada
            'CONSUMO_RESERVA': 'bg-pink-100 text-pink-800',  // Reserva consumida al convertir a venta
            'ENTRADA_AJUSTE': 'bg-emerald-100 text-emerald-800',  // Ajuste entrada
            'SALIDA_AJUSTE': 'bg-rose-100 text-rose-800',  // Ajuste salida
            'ENTRADA_COMPRA': 'bg-teal-100 text-teal-800',  // Compra recibida
        };
        return colors[tipo] || 'bg-gray-100 text-gray-800';
    };

    const handleOpenDetalles = (movimiento: MovimientoInventario) => {
        setSelectedMovimiento(movimiento);
        setIsModalOpen(true);
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center text-muted-foreground">
                        Cargando movimientos...
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Número</TableHead>
                            {/* <TableHead className="min-w-fit">Fecha</TableHead>
                            <TableHead className="min-w-fit">Hora</TableHead> */}
                            {/* <TableHead className="min-w-fit">📝 Creado</TableHead> */}
                            {/* <TableHead>Tipo</TableHead> */}
                            <TableHead>Producto</TableHead>
                            <TableHead>Almacén</TableHead>
                            {/* ✅ NUEVO (2026-02-12): Columna de Stock ID y Lote */}
                            {/* <TableHead>📦 Stock / Lote</TableHead> */}
                            <TableHead className="text-center">Cant. Anterior</TableHead>
                            <TableHead className="text-center">Cambio</TableHead>
                            <TableHead className="text-center">Cant. Posterior</TableHead>
                            {/* ✅ NUEVO (2026-02-18): Columna de conversiones de unidades */}
                            <TableHead className="text-center">📐 Conversión</TableHead>
                            {/* ✅ NUEVO: Columna de documento relacionado (venta/proforma) */}
                            <TableHead>📋 Documento</TableHead>
                            {/* <TableHead>Motivo</TableHead> */}
                            {/* <TableHead>Usuario</TableHead> */}
                            {/* ✅ NUEVO (2026-02-12): Columna de detalles */}
                            <TableHead className="text-center">Detalles</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {movimientos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={14} className="text-center text-muted-foreground py-8">
                                    No hay movimientos para mostrar
                                </TableCell>
                            </TableRow>
                        ) : (
                            movimientos.map((movimiento) => (
                                <TableRow key={movimiento.id}>
                                    <TableCell className="font-medium">
                                        <div>
                                            <div className="font-semibold">#{movimiento.id}</div>
                                            <div className="text-sm">{movimiento.referencia || movimiento.numero}</div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                <div>{new Date(movimiento.created_at).toLocaleDateString('es-ES')}</div>
                                                <div className="text-gray-500 dark:text-gray-400">
                                                    {new Date(movimiento.created_at).toLocaleTimeString('es-ES', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{movimiento.producto.nombre}</div>
                                            <div className="text-sm text-muted-foreground">
                                                #{movimiento.producto.id} | {movimiento.producto.sku}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="mb-2">{movimiento.almacen.nombre}</div>

                                        <Badge className={getTipoColor(movimiento.tipo)}>
                                            {movimiento.tipo}
                                        </Badge>
                                        <div className="text-sm">
                                            <div className="font-medium">
                                                {movimiento.stock_producto_id ? (
                                                    <span className="text-blue-600 dark:text-blue-400">
                                                        Folio Stock: {movimiento.stock_producto_id}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Lote: {movimiento.lote || '-'}
                                            </div>
                                        </div>
                                    </TableCell>
                                    {/* ✅ NUEVO: Cantidad Anterior */}
                                    <TableCell className="text-center font-medium">
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {movimiento.cantidad_anterior}
                                        </span>
                                    </TableCell>
                                    {/* ✅ NUEVO: Cambio (Cantidad) */}
                                    <TableCell className="text-center font-bold">
                                        <span className={
                                            movimiento.cantidad > 0
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-red-600 dark:text-red-400'
                                        }>
                                            {movimiento.cantidad > 0 ? '+' : ''}{movimiento.cantidad}
                                        </span>
                                    </TableCell>
                                    {/* ✅ NUEVO: Cantidad Posterior */}
                                    <TableCell className="text-center font-bold">
                                        <span className="text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                                            {movimiento.cantidad_posterior}
                                        </span>
                                    </TableCell>
                                    {/* ✅ MEJORADO (2026-02-18): Información de conversión con comparativa antes/cambio/después */}
                                    <TableCell className="text-center">
                                        {movimiento.es_conversion_aplicada ? (
                                            <div className="text-xs space-y-2">
                                                {/* EN UNIDAD DE VENTA (lo solicitado) */}
                                                <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded border border-orange-200 dark:border-orange-800">
                                                    <div className="text-gray-600 dark:text-gray-400 text-xs font-semibold mb-1">
                                                        📦 {movimiento.unidad_venta_nombre}
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-1 text-xs">
                                                        <div>
                                                            <div className="text-gray-500 dark:text-gray-400">Antes</div>
                                                            <div className="font-bold text-orange-700 dark:text-orange-400">
                                                                {movimiento.cantidad_anterior && movimiento.factor_conversion
                                                                    ? (Number(movimiento.cantidad_anterior) * Number(movimiento.factor_conversion)).toFixed(2)
                                                                    : '-'
                                                                }
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-gray-500 dark:text-gray-400">Cambio</div>
                                                            <div className="font-bold text-red-600 dark:text-red-400">
                                                                {movimiento.cantidad_solicitada
                                                                    ? Number(movimiento.cantidad_solicitada).toFixed(2)
                                                                    : '-'
                                                                }
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-gray-500 dark:text-gray-400">Después</div>
                                                            <div className="font-bold text-orange-700 dark:text-orange-400">
                                                                {movimiento.cantidad_posterior && movimiento.factor_conversion
                                                                    ? (Number(movimiento.cantidad_posterior) * Number(movimiento.factor_conversion)).toFixed(2)
                                                                    : '-'
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Factor de conversión */}
                                                {movimiento.factor_conversion ? (
                                                    <div className="flex items-center justify-center gap-1 py-0.5">
                                                        <span className="text-gray-500">Factor:</span>
                                                        <span className="text-orange-600 dark:text-orange-400 font-semibold">
                                                            1 {movimiento.unidad_base_nombre} = {Number(movimiento.factor_conversion).toFixed(2)} {movimiento.unidad_venta_nombre}
                                                        </span>
                                                    </div>
                                                ) : null}

                                                {/* EN UNIDAD BASE (lo descargado del stock) */}
                                                {/* <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-800">
                                                    <div className="text-gray-600 dark:text-gray-400 text-xs font-semibold mb-1">
                                                        📦 {movimiento.unidad_base_nombre || 'Unidad'}
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-1 text-xs">
                                                        <div>
                                                            <div className="text-gray-500 dark:text-gray-400">Antes</div>
                                                            <div className="font-bold text-blue-700 dark:text-blue-400">
                                                                {movimiento.cantidad_anterior
                                                                    ? Number(movimiento.cantidad_anterior).toFixed(2)
                                                                    : '-'
                                                                }
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-gray-500 dark:text-gray-400">Cambio</div>
                                                            <div className="font-bold text-red-600 dark:text-red-400">
                                                                {movimiento.cantidad
                                                                    ? Number(movimiento.cantidad).toFixed(2)
                                                                    : '-'
                                                                }
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-gray-500 dark:text-gray-400">Después</div>
                                                            <div className="font-bold text-blue-700 dark:text-blue-400">
                                                                {movimiento.cantidad_posterior
                                                                    ? Number(movimiento.cantidad_posterior).toFixed(2)
                                                                    : '-'
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div> */}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-500">-</span>
                                        )}
                                    </TableCell>
                                    {/* ✅ NUEVO: Documento relacionado (Venta, Proforma, etc) */}
                                    <TableCell>
                                        {movimiento.numero_documento ? (
                                            <a
                                                href={`/ventas/${movimiento.numero_documento.split('-')[1]}`}
                                                className="font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                                title={`Ver documento: ${movimiento.numero_documento}`}
                                            >
                                                📋 {movimiento.numero_documento}
                                            </a>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                        <div className="text-sm mt-2">{movimiento.motivo}</div>
                                        <div>{movimiento.usuario.name}</div>
                                    </TableCell>
                                    <TableCell>
                                        
                                        {/* <p>
                                            {movimiento.usuario.rol ? (
                                                <Badge className="bg-blue-100 text-blue-800">
                                                    {movimiento.usuario.rol}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">Sin rol</span>
                                            )}
                                        </p> */}
                                    </TableCell>
                                    {/* ✅ NUEVO (2026-02-12): Botón Ver Detalles */}
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleOpenDetalles(movimiento)}
                                            className="h-8 w-8 p-0"
                                            title="Ver detalles y observaciones del movimiento"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Paginación */}
                {pagination && pagination.last_page > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-muted-foreground">
                            Mostrando <strong>{pagination.from}</strong> a <strong>{pagination.to}</strong> de <strong>{pagination.total}</strong> resultados
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.current_page === 1}
                                onClick={() => onPageChange?.(pagination.current_page - 1)}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => {
                                    // Mostrar solo páginas cercanas a la actual
                                    if (
                                        page === 1 ||
                                        page === pagination.last_page ||
                                        (page >= pagination.current_page - 1 && page <= pagination.current_page + 1)
                                    ) {
                                        return (
                                            <Button
                                                key={page}
                                                variant={page === pagination.current_page ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => onPageChange?.(page)}
                                            >
                                                {page}
                                            </Button>
                                        );
                                    }

                                    // Mostrar puntos suspensivos
                                    if (page === pagination.current_page - 2 || page === pagination.current_page + 2) {
                                        return (
                                            <span key={`dots-${page}`} className="px-2 text-muted-foreground">
                                                ...
                                            </span>
                                        );
                                    }

                                    return null;
                                })}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.current_page === pagination.last_page}
                                onClick={() => onPageChange?.(pagination.current_page + 1)}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}

            {/* ✅ NUEVO (2026-02-12): Modal de detalles del movimiento */}
            <MovimientoDetallesModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                movimiento={selectedMovimiento}
            />
            </CardContent>
        </Card>
    );
};

export default MovimientosTable;
