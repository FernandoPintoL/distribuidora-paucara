// Presentation Layer: MovimientoCard Component
// Componente de tarjeta individual para mostrar un movimiento de inventario

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MovimientoInventario } from '@/domain/movimientos-inventario';
import { TIPOS_MOVIMIENTO } from '@/domain/movimientos-inventario';
import { MovimientosInventarioService } from '@/services/movimientos-inventario.service';
import { Clock, User, Package, MapPin, FileText } from 'lucide-react';

interface MovimientoCardProps {
    movimiento: MovimientoInventario;
    compact?: boolean;
}

export const MovimientoCard: React.FC<MovimientoCardProps> = ({
    movimiento,
    compact = false
}) => {
    const tipoInfo = TIPOS_MOVIMIENTO[movimiento.tipo];
    const esEntrada = movimiento.tipo.startsWith('ENTRADA') || movimiento.tipo === 'TRANSFERENCIA_ENTRADA';

    if (compact) {
        return (
            <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                <div className="flex items-center gap-3">
                    <div className="text-lg">{tipoInfo.icon}</div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {movimiento.stockProducto?.producto?.nombre || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {movimiento.stockProducto?.almacen?.nombre || 'N/A'}
                        </p>
                    </div>
                </div>

                <div className="text-right">
                    <p className={`text-sm font-medium ${esEntrada ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                        {MovimientosInventarioService.formatCantidad(
                            esEntrada ? movimiento.cantidad : -movimiento.cantidad
                        )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {MovimientosInventarioService.formatFechaCorta(movimiento.created_at || '')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Badge className={tipoInfo.color}>
                            <span className="mr-1">{tipoInfo.icon}</span>
                            {tipoInfo.label}
                        </Badge>
                    </div>
                    <div className="text-right">
                        <p className={`text-lg font-bold ${esEntrada ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                            {MovimientosInventarioService.formatCantidad(
                                esEntrada ? movimiento.cantidad : -movimiento.cantidad
                            )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Stock: {movimiento.stock_anterior} → {movimiento.stock_nuevo}
                        </p>
                    </div>
                </div>

                {/* Información del producto */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {movimiento.stockProducto?.producto?.nombre || 'N/A'}
                            </p>
                            {movimiento.stockProducto?.producto?.categoria && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {movimiento.stockProducto.producto.categoria.nombre}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            {movimiento.stockProducto?.almacen?.nombre || 'N/A'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            {MovimientosInventarioService.formatFecha(movimiento.created_at || '')}
                        </p>
                    </div>

                    {movimiento.user && (
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {movimiento.user.name}
                            </p>
                        </div>
                    )}

                    {movimiento.numero_documento && (
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <p className="text-sm font-mono text-gray-600 dark:text-gray-300">
                                {movimiento.numero_documento}
                            </p>
                        </div>
                    )}

                    {movimiento.observacion && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-300">
                            {movimiento.observacion}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default MovimientoCard;
