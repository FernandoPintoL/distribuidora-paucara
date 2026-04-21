import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { formatCurrencyMinimalDecimals } from '@/lib/utils';

interface Pago {
    id: string;
    tipo_pago_id: number;
    monto: number;
    tipo_pago_nombre?: string;
}

interface FormularioPagosVentaProps {
    tiposPago: Array<{ id: number; nombre: string }>;
    totalVenta: number;
    pagosRegistrados: Pago[];
    onPagosChange: (pagos: Pago[]) => void;
    disabled?: boolean;
}

export default function FormularioPagosVenta({
    tiposPago,
    totalVenta,
    pagosRegistrados,
    onPagosChange,
    disabled = false,
}: FormularioPagosVentaProps) {
    const [montoPago, setMontoPago] = useState('');
    const [tipoPagoId, setTipoPagoId] = useState<number | ''>('');
    const [error, setError] = useState<string>('');

    const pagoActual = {
        id: '',
        tipo_pago_id: Number(tipoPagoId) || 0,
        monto: Number(montoPago) || 0,
    };

    const totalPagado = pagosRegistrados.reduce((sum, p) => sum + p.monto, 0);
    const pendiente = Math.max(0, totalVenta - totalPagado);
    const excedente = Math.max(0, totalPagado - totalVenta);

    const tipoPagoSeleccionado = tiposPago.find((t) => t.id === pagoActual.tipo_pago_id);

    const handleAgregarPago = () => {
        setError('');

        if (!tipoPagoId) {
            setError('Selecciona un tipo de pago');
            return;
        }

        if (!montoPago || Number(montoPago) <= 0) {
            setError('El monto debe ser mayor a 0');
            return;
        }

        const monto = Number(montoPago);
        if (totalPagado + monto > totalVenta * 1.1) {
            // Permitir hasta 10% de excedente (cambio)
            setError(`El pago excede el total permitido (${formatCurrencyMinimalDecimals(totalVenta * 1.1)})`);
            return;
        }

        const nuevoPago: Pago = {
            id: Date.now().toString(),
            tipo_pago_id: Number(tipoPagoId),
            monto: monto,
            tipo_pago_nombre: tipoPagoSeleccionado?.nombre,
        };

        onPagosChange([...pagosRegistrados, nuevoPago]);
        setMontoPago('');
        setTipoPagoId('');
    };

    const handleEliminarPago = (id: string) => {
        onPagosChange(pagosRegistrados.filter((p) => p.id !== id));
    };

    return (
        <div className="space-y-4 mt-4 p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-lg border border-gray-200 dark:border-zinc-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Desglose de Pagos
            </h3>

            {/* Formulario para agregar pagos */}
            <div className="space-y-3 pb-4 border-b border-gray-200 dark:border-zinc-700">
                <div className="grid grid-cols-3 gap-2">
                    {/* Tipo de Pago */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tipo de Pago
                        </label>
                        <select
                            value={tipoPagoId}
                            onChange={(e) => setTipoPagoId(e.target.value ? Number(e.target.value) : '')}
                            disabled={disabled}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                        >
                            <option value="">Seleccionar</option>
                            {tiposPago.map((tipo) => (
                                <option key={tipo.id} value={tipo.id}>
                                    {tipo.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Monto */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Monto
                        </label>
                        <input
                            type="number"
                            value={montoPago}
                            onChange={(e) => setMontoPago(e.target.value)}
                            disabled={disabled}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-white text-right focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 [&::-webkit-outer-spin-button]:[appearance:none] [&::-webkit-inner-spin-button]:[appearance:none] [appearance:textfield]"
                        />
                    </div>

                    {/* Botón Agregar */}
                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={handleAgregarPago}
                            disabled={disabled || !tipoPagoId || !montoPago}
                            className="w-full px-3 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={16} />
                            Agregar
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="text-xs text-red-600 dark:text-red-400">
                        ⚠️ {error}
                    </div>
                )}
            </div>

            {/* Tabla de pagos agregados */}
            {pagosRegistrados.length > 0 && (
                <div className="space-y-2">
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {pagosRegistrados.map((pago) => (
                            <div
                                key={pago.id}
                                className="flex items-center justify-between p-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md"
                            >
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {pago.tipo_pago_nombre}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white w-24 text-right">
                                        {formatCurrencyMinimalDecimals(pago.monto)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleEliminarPago(pago.id)}
                                        disabled={disabled}
                                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                                        title="Eliminar pago"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Resumen de pagos */}
                    <div className="pt-3 border-t border-gray-200 dark:border-zinc-700 space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700 dark:text-gray-300">Total a pagar:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                                {formatCurrencyMinimalDecimals(totalVenta)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-700 dark:text-gray-300">Total pagado:</span>
                            <span className={`font-semibold ${totalPagado === totalVenta ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                {formatCurrencyMinimalDecimals(totalPagado)}
                            </span>
                        </div>
                        {pendiente > 0 && (
                            <div className="flex justify-between items-center text-red-600 dark:text-red-400">
                                <span>Pendiente:</span>
                                <span className="font-semibold">
                                    {formatCurrencyMinimalDecimals(pendiente)}
                                </span>
                            </div>
                        )}
                        {excedente > 0 && (
                            <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                                <span>Cambio:</span>
                                <span className="font-semibold">
                                    {formatCurrencyMinimalDecimals(excedente)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {pagosRegistrados.length === 0 && (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                    Sin pagos agregados
                </div>
            )}
        </div>
    );
}
