import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { Badge } from '@/presentation/components/ui/badge';

interface DetalleReversionModalProps {
    isOpen: boolean;
    onClose: () => void;
    data?: {
        venta_numero: string;
        venta_estado: string;
        reversión_completa: boolean;
        estado: 'completa' | 'incompleta' | 'sin-reversiones' | 'sin-movimientos';
        movimientos_original: Record<string, number>;
        movimientos_revercion: Record<string, number>;
        detalles: Array<{
            stock_producto_id: number;
            producto_nombre: string;
            cantidad_original: number;
            cantidad_revercion: number | null;
            match: boolean;
            estado: string;
        }>;
    };
}

export default function DetalleReversionModal({ isOpen, onClose, data }: DetalleReversionModalProps) {
    if (!data) return null;

    const getEstadoIcon = () => {
        switch (data.estado) {
            case 'completa':
                return <CheckCircle2 className="w-5 h-5 text-green-600" />;
            case 'incompleta':
                return <AlertCircle className="w-5 h-5 text-yellow-600" />;
            case 'sin-reversiones':
                return <XCircle className="w-5 h-5 text-red-600" />;
            default:
                return <AlertCircle className="w-5 h-5 text-gray-600" />;
        }
    };

    const getEstadoColor = () => {
        switch (data.estado) {
            case 'completa':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
            case 'incompleta':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
            case 'sin-reversiones':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {getEstadoIcon()}
                        Auditoría de Reversión de Stock - {data.venta_numero}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Estado General */}
                    <div className={`p-4 rounded-lg ${getEstadoColor()}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold">Estado de Reversión</h3>
                                <p className="text-sm opacity-90">
                                    {data.reversión_completa ? '✅ Reversión Completa y Correcta' : '⚠️ Reversión Incompleta o Faltante'}
                                </p>
                            </div>
                            <Badge variant="outline" className="text-lg">
                                {data.estado === 'completa' ? '✅' : data.estado === 'incompleta' ? '⚠️' : '❌'}
                            </Badge>
                        </div>
                    </div>

                    {/* Resumen de Movimientos */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-200">
                                Movimientos Originales
                            </h4>
                            <div className="mt-2 space-y-1 text-sm">
                                {Object.entries(data.movimientos_original).map(([tipo, cantidad]) => (
                                    <div key={tipo} className="flex justify-between">
                                        <span className="text-blue-700 dark:text-blue-300">{tipo}:</span>
                                        <span className="font-mono font-semibold text-blue-900 dark:text-blue-200">
                                            {cantidad}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <h4 className="font-semibold text-sm text-green-900 dark:text-green-200">
                                Movimientos de Reversión
                            </h4>
                            <div className="mt-2 space-y-1 text-sm">
                                {Object.entries(data.movimientos_revercion).length > 0 ? (
                                    Object.entries(data.movimientos_revercion).map(([tipo, cantidad]) => (
                                        <div key={tipo} className="flex justify-between">
                                            <span className="text-green-700 dark:text-green-300">{tipo}:</span>
                                            <span className="font-mono font-semibold text-green-900 dark:text-green-200">
                                                +{cantidad}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-red-600 dark:text-red-400">❌ Sin reversiones registradas</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Detalle por Producto */}
                    <div className="border rounded-lg overflow-hidden">
                        <h4 className="font-semibold p-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">
                            Detalle de Reversiones por Producto
                        </h4>
                        <div className="divide-y">
                            {data.detalles.map((detalle, idx) => (
                                <div key={idx} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <p className="font-medium text-sm text-gray-900 dark:text-white">
                                                {detalle.producto_nombre}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                Stock ID: {detalle.stock_producto_id}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            {detalle.match ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            ) : (
                                                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-xs font-mono">
                                        <span className={detalle.cantidad_original < 0 ? 'text-red-600 dark:text-red-400' : ''}>
                                            Original: {detalle.cantidad_original}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400">→</span>
                                        <span className={detalle.cantidad_revercion && detalle.cantidad_revercion > 0 ? 'text-green-600 dark:text-green-400' : ''}>
                                            Reversión: {detalle.cantidad_revercion !== null ? `+${detalle.cantidad_revercion}` : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="mt-2">
                                        <Badge
                                            variant={detalle.match ? 'default' : 'destructive'}
                                            className="text-xs"
                                        >
                                            {detalle.estado}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Nota de Auditoría */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-sm text-blue-900 dark:text-blue-200">
                        <p className="font-semibold mb-1">📋 Nota de Auditoría:</p>
                        <p>
                            Esta verificación compara los movimientos originales (CONSUMO_RESERVA o SALIDA_VENTA)
                            con sus correspondientes reversiones (ENTRADA_AJUSTE). Si todas las cantidades coinciden,
                            la reversión de stock fue correcta.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
