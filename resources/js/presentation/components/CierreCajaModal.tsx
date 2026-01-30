import React, { Fragment, useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Textarea } from '@/presentation/components/ui/textarea';
import toast from 'react-hot-toast';
import { OutputSelectionModal, type TipoDocumento } from '@/presentation/components/impresion/OutputSelectionModal';

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

interface MovimientoCaja {
    id: number;
    venta_id?: number;
    pago_id?: number;
    monto: number;
    fecha: string;
    tipo_operacion: {
        nombre: string;
    };
    tipo_pago?: {
        nombre: string;
    };
}

interface Props {
    show: boolean;
    onClose: () => void;
    cajaAbierta: AperturaCaja | null;
    montoEsperado: number;
    movimientos?: MovimientoCaja[];
}

export default function CierreCajaModal({ show, onClose, cajaAbierta, montoEsperado, movimientos = [] }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        monto_real: '',
        observaciones: '',
        fecha_cierre: new Date().toISOString().split('T')[0]
    });

    const [outputModal, setOutputModal] = useState<{ isOpen: boolean; aperturaId?: number }>({ isOpen: false });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/cajas/cerrar', {
            onSuccess: () => {
                toast.success('Caja cerrada exitosamente');
                reset();
                if (cajaAbierta) {
                    setOutputModal({ isOpen: true, aperturaId: cajaAbierta.id });
                }
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

    const toNumber = (value: any) => {
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    };

    // Calcular rango de ventas
    const calcularRangoVentas = () => {
        const ventaIds = movimientos
            .map((mov) => mov.venta_id)
            .filter((id): id is number => id !== null && id !== undefined && id > 0);

        if (ventaIds.length === 0) return null;

        const minId = Math.min(...ventaIds);
        const maxId = Math.max(...ventaIds);
        const totalVentas = ventaIds.length;

        return { minId, maxId, totalVentas };
    };

    // Calcular montos por tipo de pago
    const calcularMontosPorTipoPago = () => {
        const agrupadosPorTipo: Record<string, number> = {};
        const conteosPorTipo: Record<string, number> = {};

        movimientos.forEach((mov) => {
            const tipoPago = mov.tipo_pago?.nombre || 'Sin tipo de pago';
            agrupadosPorTipo[tipoPago] = (agrupadosPorTipo[tipoPago] || 0) + toNumber(mov.monto);
            conteosPorTipo[tipoPago] = (conteosPorTipo[tipoPago] || 0) + 1;
        });

        return Object.entries(agrupadosPorTipo).map(([tipo, total]) => ({
            tipo,
            total,
            count: conteosPorTipo[tipo],
        }));
    };

    // Calcular ingresos y egresos
    const calcularIngresosYEgresos = () => {
        let ingresos = 0;
        let egresos = 0;

        movimientos.forEach((mov) => {
            const monto = toNumber(mov.monto);
            if (monto > 0) {
                ingresos += monto;
            } else {
                egresos += Math.abs(monto);
            }
        });

        return { ingresos, egresos };
    };

    // Calcular totales por tipo de operación
    const calcularTotalesPorTipoOperacion = () => {
        const tiposOperacion: Record<string, { total: number; count: number }> = {};

        movimientos.forEach((mov) => {
            const tipoNombre = mov.tipo_operacion.nombre;
            if (!tiposOperacion[tipoNombre]) {
                tiposOperacion[tipoNombre] = { total: 0, count: 0 };
            }
            tiposOperacion[tipoNombre].total += toNumber(mov.monto);
            tiposOperacion[tipoNombre].count += 1;
        });

        // Ordenar por tipo (ventas primero, luego pagos, luego otros)
        const orden = ['VENTA', 'PAGO', 'CREDITO', 'GASTO'];
        const tiposOrdenados = Object.entries(tiposOperacion).sort(([a], [b]) => {
            const indexA = orden.findIndex(o => a.includes(o));
            const indexB = orden.findIndex(o => b.includes(o));
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });

        return tiposOrdenados.map(([tipo, datos]) => ({
            tipo,
            total: datos.total,
            count: datos.count,
        }));
    };

    const rangoVentas = calcularRangoVentas();
    const montosPorTipoPago = calcularMontosPorTipoPago();
    const { ingresos, egresos } = calcularIngresosYEgresos();
    const totalesPorTipoOperacion = calcularTotalesPorTipoOperacion();
    const diferencia = data.monto_real ? parseFloat(data.monto_real) - montoEsperado : 0;

    if (!cajaAbierta) return null;

    return (
        <Fragment>
            <Dialog open={show} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px] flex flex-col max-h-[90vh]">
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
                                {/* <div>
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Ubicación:</span>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{cajaAbierta.caja.ubicacion}</p>
                                </div> */}
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
                        {/* Rango de Ventas */}
                        {rangoVentas && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">
                                    📊 Rango de Ventas (IDs)
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">ID Inicial</p>
                                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">#{rangoVentas.minId}</p>
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <p className="text-2xl text-blue-400 dark:text-blue-500">→</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">ID Final</p>
                                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">#{rangoVentas.maxId}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                    Total de {rangoVentas.totalVentas} venta{rangoVentas.totalVentas !== 1 ? 's' : ''}
                                </p>
                            </div>
                        )}

                        {/* Totales de Ingresos y Egresos */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
                                <p className="text-xs text-green-600 dark:text-green-400 mb-2">⬆️ Total Ingresos</p>
                                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                    {formatCurrency(ingresos)}
                                </p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-700">
                                <p className="text-xs text-red-600 dark:text-red-400 mb-2">⬇️ Total Egresos</p>
                                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                                    {formatCurrency(egresos)}
                                </p>
                            </div>
                            <div className={`p-4 rounded-lg border ${(ingresos - egresos) >= 0
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700'
                                : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700'
                            }`}>
                                <p className={`text-xs mb-2 ${(ingresos - egresos) >= 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-orange-600 dark:text-orange-400'
                                }`}>💰 Total Neto</p>
                                <p className={`text-2xl font-bold ${(ingresos - egresos) >= 0
                                    ? 'text-emerald-700 dark:text-emerald-300'
                                    : 'text-orange-700 dark:text-orange-300'
                                }`}>
                                    {formatCurrency(ingresos - egresos)}
                                </p>
                            </div>
                        </div>
                        {/* Montos por Tipo de Pago */}
                        {montosPorTipoPago.length > 0 && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                                <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-3">
                                    💳 Montos por Tipo de Pago
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {montosPorTipoPago.map((item) => (
                                        <div
                                            key={item.tipo}
                                            className="bg-white dark:bg-gray-800 p-3 rounded border border-purple-200 dark:border-purple-700"
                                        >
                                            <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">
                                                {item.tipo}
                                            </p>
                                            <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                                                {formatCurrency(Math.abs(item.total))}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {item.count} movimiento{item.count !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    ))}
                                    {/* Total por Tipo de Pago */}
                                    <div className="bg-purple-700 dark:bg-purple-800 p-3 rounded border border-purple-700 dark:border-purple-600 col-span-1 md:col-span-2">
                                        <p className="text-xs text-purple-100 mb-1">💰 Total</p>
                                        <p className="text-xl font-bold text-white">
                                            {formatCurrency(montosPorTipoPago.reduce((sum, item) => sum + Math.abs(item.total), 0))}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Resumen por Tipo de Operación */}
                        {totalesPorTipoOperacion.length > 0 && (
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-700">
                                <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-3">
                                    📊 Resumen por Tipo de Operación
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {totalesPorTipoOperacion.map((item) => {
                                        const isPositive = item.total >= 0;
                                        return (
                                            <div
                                                key={item.tipo}
                                                className={`p-3 rounded border ${isPositive
                                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                                                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                                                    }`}
                                            >
                                                <p className={`text-xs mb-1 ${isPositive
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-red-600 dark:text-red-400'
                                                    }`}>
                                                    {item.tipo}
                                                </p>
                                                <p className={`text-lg font-bold ${isPositive
                                                    ? 'text-green-700 dark:text-green-300'
                                                    : 'text-red-700 dark:text-red-300'
                                                    }`}>
                                                    {formatCurrency(item.total)}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {item.count} movimiento{item.count !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        );
                                    })}
                                    {/* Total por Tipo de Operación */}
                                    <div className="bg-indigo-700 dark:bg-indigo-800 p-3 rounded border border-indigo-700 dark:border-indigo-600 col-span-1 md:col-span-2 lg:col-span-3">
                                        <p className="text-xs text-indigo-100 mb-1">💵 Total General</p>
                                        <p className="text-xl font-bold text-white">
                                            {formatCurrency(totalesPorTipoOperacion.reduce((sum, item) => sum + item.total, 0))}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
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
                        <div className='py-2'></div>
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

            {outputModal.isOpen && outputModal.aperturaId && (
                <OutputSelectionModal
                    isOpen={outputModal.isOpen}
                    onClose={() => {
                        setOutputModal({ isOpen: false });
                        onClose();
                    }}
                    documentoId={outputModal.aperturaId}
                    tipoDocumento={'caja' as TipoDocumento}
                />
            )}
        </Fragment>
    );
}
