import React from 'react';
import { useForm } from '@inertiajs/react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Textarea } from '@/presentation/components/ui/textarea';
import toast from 'react-hot-toast';

interface AperturaCaja {
    id: number;
    caja_id: number;
    user_id: number;
    fecha: string;
    monto_apertura: number;
    observaciones?: string;
    caja: {
        id: number;
        nombre: string;
        ubicacion: string;
    };
}

interface Props {
    show: boolean;
    onClose: () => void;
    cajaAbierta: AperturaCaja | null;
    montoEsperado: number;
}

export default function CierreCajaModal({ show, onClose, cajaAbierta, montoEsperado }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        monto_real: '',
        observaciones: '',
        fecha_cierre: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/cajas/cerrar', {
            onSuccess: () => {
                toast.success('Caja cerrada exitosamente');
                reset();
                onClose();
            },
            onError: (errors) => {
                Object.values(errors).forEach(error => {
                    toast.error(error as string);
                });
            }
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const diferencia = data.monto_real ? parseFloat(data.monto_real) - montoEsperado : 0;

    if (!cajaAbierta) return null;

    return (
        <Dialog open={show} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        🔒 Cerrar Caja del Día
                    </DialogTitle>
                    <DialogDescription>
                        Cuenta el dinero físico en caja y registra el cierre del día.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="space-y-4 overflow-y-auto flex-1 px-6">
                        {/* Información de la caja */}
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                                {cajaAbierta.caja.nombre}
                            </h4>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Ubicación:</span>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{cajaAbierta.caja.ubicacion}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Fecha de Apertura:</span>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                        {new Date(cajaAbierta.fecha).toLocaleDateString('es-BO', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit'
                                        })} - {new Date(cajaAbierta.fecha).toLocaleTimeString('es-BO', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                                <div className="border-t border-gray-300 dark:border-gray-500 pt-3">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Fecha de Cierre:</span>
                                    <input
                                        type="date"
                                        value={data.fecha_cierre}
                                        onChange={(e) => setData('fecha_cierre', e.target.value)}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        ⚠️ Puedes cerrar hoy o en fechas anteriores
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Resumen financiero */}
                        <div className="space-y-3 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Monto Inicial:</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(cajaAbierta.monto_apertura)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Movimientos del día:</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {formatCurrency(montoEsperado - cajaAbierta.monto_apertura)}
                                </span>
                            </div>
                            <div className="flex justify-between text-lg font-semibold border-t border-gray-300 dark:border-gray-600 pt-2">
                                <span className="text-gray-900 dark:text-gray-100">Total Esperado:</span>
                                <span className="text-green-600 dark:text-green-400">{formatCurrency(montoEsperado)}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="monto_real" className="text-gray-900 dark:text-gray-100">Dinero Físico Contado (Bs) *</Label>
                            <Input
                                id="monto_real"
                                type="number"
                                step="0.01"
                                min="0"
                                value={data.monto_real}
                                onChange={(e) => setData('monto_real', e.target.value)}
                                placeholder="0.00"
                                className="text-right text-lg font-medium dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600"
                            />
                            {errors.monto_real && (
                                <p className="text-sm text-red-600 dark:text-red-400">{errors.monto_real}</p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Cuenta todo el dinero físico que tienes en la caja
                            </p>
                        </div>

                        {/* Mostrar diferencia si hay monto ingresado */}
                        {data.monto_real && (
                            <div className={`p-3 rounded-lg ${diferencia === 0
                                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'
                                    : diferencia > 0
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
                                }`}>
                                <div className="flex justify-between items-center">
                                    <span className={`font-medium ${diferencia === 0
                                        ? 'text-gray-900 dark:text-green-300'
                                        : diferencia > 0
                                            ? 'text-gray-900 dark:text-blue-300'
                                            : 'text-gray-900 dark:text-red-300'
                                        }`}>Diferencia:</span>
                                    <span className={`font-bold text-lg ${diferencia === 0
                                        ? 'text-green-600 dark:text-green-400'
                                        : diferencia > 0
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {diferencia === 0 ? '✅ ' : diferencia > 0 ? '📈 +' : '📉 '}
                                        {formatCurrency(Math.abs(diferencia))}
                                    </span>
                                </div>
                                <p className={`text-xs mt-1 ${diferencia === 0
                                    ? 'text-gray-600 dark:text-green-300'
                                    : diferencia > 0
                                        ? 'text-gray-600 dark:text-blue-300'
                                        : 'text-gray-600 dark:text-red-300'
                                    }`}>
                                    {diferencia === 0 && 'Perfecto! No hay diferencias.'}
                                    {diferencia > 0 && 'Sobrante - Tienes más dinero del esperado.'}
                                    {diferencia < 0 && 'Faltante - Tienes menos dinero del esperado.'}
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="observaciones" className="text-gray-900 dark:text-gray-100">
                                Observaciones {diferencia !== 0 && '(Explica la diferencia)'}
                            </Label>
                            <Textarea
                                id="observaciones"
                                value={data.observaciones}
                                onChange={(e) => setData('observaciones', e.target.value)}
                                placeholder={
                                    diferencia !== 0
                                        ? "Explica el motivo de la diferencia..."
                                        : "Notas adicionales sobre el cierre..."
                                }
                                rows={3}
                                className="dark:text-gray-100 dark:bg-gray-700 dark:border-gray-600"
                            />
                            {errors.observaciones && (
                                <p className="text-sm text-red-600 dark:text-red-400">{errors.observaciones}</p>
                            )}
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end space-x-2 bg-white dark:bg-gray-800 flex-shrink-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={processing}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || !data.monto_real}
                            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white"
                        >
                            {processing ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Cerrando...
                                </span>
                            ) : (
                                '🔒 Cerrar Caja'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
