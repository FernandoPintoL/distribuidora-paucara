import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog';
import { Button } from '@/presentation/components/ui/button';
import { Badge } from '@/presentation/components/ui/badge';
import { Copy, X } from 'lucide-react';

interface MovimientoDetallesModalProps {
    isOpen: boolean;
    onClose: () => void;
    movimiento: {
        id: number;
        numero_documento?: string;
        tipo: string;
        producto: { id: number; nombre: string; sku: string };
        cantidad: number;
        cantidad_anterior?: number;
        cantidad_posterior?: number;
        observacion?: string;
        created_at: string;
        usuario: { name: string };
        referencia?: string;
    } | null;
}

export default function MovimientoDetallesModal({
    isOpen,
    onClose,
    movimiento
}: MovimientoDetallesModalProps) {
    if (!movimiento) return null;

    // Intentar parsear el JSON de observación
    let observacionParsed: any = null;
    try {
        if (movimiento.observacion) {
            observacionParsed = JSON.parse(movimiento.observacion);
        }
    } catch (e) {
        // Si no es JSON válido, mostrar como texto
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>📋 Detalles del Movimiento #{movimiento.id}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-6 w-6 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Información General */}
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-3">
                        <h3 className="font-semibold text-sm">📌 Información General</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs text-muted-foreground">Tipo de Movimiento</span>
                                <div className="mt-1">
                                    <Badge>{movimiento.tipo}</Badge>
                                </div>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground">Número de Documento</span>
                                <p className="font-medium text-sm mt-1">
                                    {movimiento.numero_documento || '-'}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground">Referencia</span>
                                <p className="font-medium text-sm mt-1">
                                    {movimiento.referencia || '-'}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground">Fecha/Hora</span>
                                <p className="font-medium text-sm mt-1">
                                    {new Date(movimiento.created_at).toLocaleString('es-ES')}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground">Usuario</span>
                                <p className="font-medium text-sm mt-1">
                                    {movimiento.usuario.name}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Información del Producto */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-3">
                        <h3 className="font-semibold text-sm">📦 Información del Producto</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs text-muted-foreground">Producto</span>
                                <p className="font-medium text-sm mt-1">
                                    {movimiento.producto.nombre}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground">SKU</span>
                                <p className="font-medium text-sm mt-1">
                                    {movimiento.producto.sku}
                                </p>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground">ID Producto</span>
                                <p className="font-medium text-sm mt-1">
                                    #{movimiento.producto.id}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Cambios de Stock */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg space-y-3">
                        <h3 className="font-semibold text-sm">📊 Cambios de Stock</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <span className="text-xs text-muted-foreground block">Cantidad Anterior</span>
                                <p className="text-2xl font-bold mt-1">
                                    {movimiento.cantidad_anterior ?? 'N/A'}
                                </p>
                            </div>
                            <div className="text-center flex items-center justify-center">
                                <div>
                                    <span className="text-xs text-muted-foreground block">Cambio</span>
                                    <p className={`text-2xl font-bold mt-1 ${
                                        movimiento.cantidad > 0
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                    }`}>
                                        {movimiento.cantidad > 0 ? '+' : ''}{movimiento.cantidad}
                                    </p>
                                </div>
                            </div>
                            <div className="text-center">
                                <span className="text-xs text-muted-foreground block">Cantidad Posterior</span>
                                <p className="text-2xl font-bold mt-1">
                                    {movimiento.cantidad_posterior ?? 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Observaciones / JSON */}
                    {(observacionParsed || movimiento.observacion) && (
                        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-sm">📝 Observaciones Detalladas</h3>
                                {movimiento.observacion && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(movimiento.observacion || '')}
                                        className="h-7 gap-1"
                                    >
                                        <Copy className="h-3 w-3" />
                                        Copiar
                                    </Button>
                                )}
                            </div>

                            {observacionParsed ? (
                                // Mostrar JSON formateado
                                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">
                                    <pre className="text-xs whitespace-pre-wrap break-words font-mono">
                                        {JSON.stringify(observacionParsed, null, 2)}
                                    </pre>
                                </div>
                            ) : (
                                // Mostrar como texto plano
                                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
                                    <p className="text-sm whitespace-pre-wrap">
                                        {movimiento.observacion || 'Sin observaciones'}
                                    </p>
                                </div>
                            )}

                            {/* Información destacada si es CONSUMO_RESERVA */}
                            {observacionParsed && observacionParsed.venta_numero && (
                                <div className="bg-pink-50 dark:bg-pink-900/20 p-3 rounded mt-3 border-l-4 border-pink-500">
                                    <p className="text-sm font-semibold text-pink-900 dark:text-pink-200">
                                        🔗 Venta Asociada
                                    </p>
                                    <p className="text-sm text-pink-800 dark:text-pink-300 mt-1">
                                        <strong>Número:</strong> {observacionParsed.venta_numero}
                                        {observacionParsed.venta_id && (
                                            <span className="ml-2">
                                                <strong>ID:</strong> {observacionParsed.venta_id}
                                            </span>
                                        )}
                                    </p>
                                    {observacionParsed.producto_nombre && (
                                        <p className="text-sm text-pink-800 dark:text-pink-300 mt-1">
                                            <strong>Producto:</strong> {observacionParsed.producto_nombre}
                                        </p>
                                    )}
                                    {observacionParsed.cantidad_consumida && (
                                        <p className="text-sm text-pink-800 dark:text-pink-300 mt-1">
                                            <strong>Cantidad Consumida:</strong> {observacionParsed.cantidad_consumida}
                                        </p>
                                    )}
                                    {observacionParsed.lote && (
                                        <p className="text-sm text-pink-800 dark:text-pink-300 mt-1">
                                            <strong>Lote:</strong> {observacionParsed.lote}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
