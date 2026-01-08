import React, { useState } from 'react';
import { Input } from '@/presentation/components/ui/input';
import { AlertCircle, Check } from 'lucide-react';
import {
    AlmacenRegistroRowProps
} from '@/domain/entities/inventario-inicial';

// const DEBOUNCE_MS = 500;

// Función para convertir ISO 8601 a formato YYYY-MM-DD para input date
const convertirFechaAlFormato = (fecha?: string | null): string => {
    if (!fecha) return '';
    try {
        // Si la fecha es ISO (2027-05-31T04:00:00.000000Z), extraer solo la fecha
        if (fecha.includes('T')) {
            return fecha.split('T')[0];
        }
        // Si ya está en formato YYYY-MM-DD, devolver como está
        return fecha;
    } catch {
        return '';
    }
};

export default function AlmacenRegistroRow({
    // producto,
    almacen,
    item,
    // onGuardarItem,
    mostrarNombreAlmacen = true,
}: AlmacenRegistroRowProps) {
    const [cantidad, setCantidad] = useState<string>(item?.cantidad?.toString() || '');
    const [lote, setLote] = useState<string>(item?.lote || '');
    const [fechaVencimiento, setFechaVencimiento] = useState<string>(
        convertirFechaAlFormato(item?.fecha_vencimiento)
    );

    const [estado, setEstado] = useState<'idle' | 'guardando' | 'error' | 'pendiente'>('idle');
    const [errorMsg, setErrorMsg] = useState<string>('');

    const handleCantidadChange = (value: string) => {
        // Validación: si hay cantidad, debe ser número positivo
        if (value && isNaN(Number(value))) {
            setEstado('error');
            setErrorMsg('Cantidad debe ser un número');
            return;
        }

        if (value && Number(value) < 0) {
            setEstado('error');
            setErrorMsg('Cantidad no puede ser negativa');
            return;
        }

        setCantidad(value);
        setEstado('pendiente');
        setErrorMsg('');
    };

    const handleLoteChange = (value: string) => {
        setLote(value);
        setEstado('pendiente');
        setErrorMsg('');
    };

    const handleFechaChange = (value: string) => {
        setFechaVencimiento(value);
        setEstado('pendiente');
        setErrorMsg('');
    };

    /* const guardarItem = async () => {
        try {
            setEstado('guardando');
            setErrorMsg('');

            await onGuardarItem(
                producto.id,
                almacen.id,
                cantidad ? Number(cantidad) : undefined,
                lote || undefined,
                fechaVencimiento || undefined
            );

            setEstado('idle');
        } catch (error) {
            setEstado('error');
            setErrorMsg(
                error instanceof Error ? error.message : 'Error guardando item'
            );
        }
    }; */

    const hayDatos = cantidad || lote || fechaVencimiento;

    return (
        <div className="px-3 sm:px-4 py-3">
            {/* Nombre del almacén - visible solo en la primera fila */}
            {mostrarNombreAlmacen && (
                <div className="mb-3 sm:hidden">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            🏢 {almacen.nombre}
                        </p>
                        {item?.es_actualizacion && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                Stock actual
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Grid responsivo: 2 columnas en móvil, 5 en desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 items-start">
                {/* Nombre del almacén - desktop solo */}
                <div className="hidden sm:block col-span-1">
                    {mostrarNombreAlmacen ? (
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                🏢 {almacen.nombre}
                            </p>
                            {item?.es_actualizacion && (
                                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded whitespace-nowrap">
                                    Stock actual
                                </span>
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Cantidad */}
                <div className="col-span-1">
                    <Input
                        type="number"
                        placeholder="Cantidad"
                        value={cantidad}
                        onChange={(e) => handleCantidadChange(e.target.value)}
                        className="text-xs sm:text-sm h-8 sm:h-9"
                        disabled={estado === 'guardando'}
                        min="0"
                        step="0.01"
                    />
                    <label className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Cant.</label>
                </div>

                {/* Lote */}
                <div className="col-span-1">
                    <Input
                        type="text"
                        placeholder="Lote"
                        value={lote}
                        onChange={(e) => handleLoteChange(e.target.value)}
                        className="text-xs sm:text-sm h-8 sm:h-9"
                        disabled={estado === 'guardando'}
                    />
                    <label className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Lote</label>
                </div>

                {/* Fecha vencimiento */}
                <div className="col-span-1">
                    <Input
                        type="date"
                        value={fechaVencimiento}
                        onChange={(e) => handleFechaChange(e.target.value)}
                        className="text-xs sm:text-sm h-8 sm:h-9"
                        disabled={estado === 'guardando'}
                    />
                    <label className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Venc.</label>
                </div>

                {/* Estado de cambios */}
                <div className="col-span-1 flex justify-end items-center gap-1">
                    {estado === 'guardando' ? (
                        <div className="h-5 w-5 sm:h-6 sm:w-6 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    ) : estado === 'error' ? (
                        <div title={errorMsg} className="h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 dark:text-red-400" />
                        </div>
                    ) : estado === 'pendiente' ? (
                        <div className="flex items-center gap-1 text-xs sm:text-sm">
                            <div className="h-2 w-2 bg-yellow-500 dark:bg-yellow-400 rounded-full flex-shrink-0" />
                            <span className="text-yellow-600 dark:text-yellow-400 font-medium hidden sm:inline">Pendiente</span>
                        </div>
                    ) : hayDatos ? (
                        <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 dark:text-green-400 flex-shrink-0" />
                    ) : null}
                </div>
            </div>

            {/* Error message */}
            {estado === 'error' && errorMsg && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-2">{errorMsg}</p>
            )}
        </div>
    );
}
