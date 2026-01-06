import React, { useEffect, useState, useRef } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface Props {
    onBarcodeDetected: (codigo: string) => Promise<void>;
    enabled?: boolean;
}

export default function ScannerCodigoBarras({ onBarcodeDetected, enabled = true }: Props) {
    const [codigoDetectado, setCodigoDetectado] = useState('');
    const [procesando, setProcesando] = useState(false);
    const codigoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const codigoBufferRef = useRef('');

    useEffect(() => {
        // Solo escuchar eventos si el scanner está habilitado
        if (!enabled) {
            return;
        }

        // Escuchar eventos de teclado para simular scanner de código de barras
        // La mayoría de scanners de código de barras emiten eventos de teclado
        const handleKeyPress = async (e: KeyboardEvent) => {
            // Ignorar si está escribiendo en un input/textarea de otra forma
            if (procesando) return;

            // Agregar carácter al buffer
            codigoBufferRef.current += e.key;

            // Limpiar timeout anterior
            if (codigoTimeoutRef.current) {
                clearTimeout(codigoTimeoutRef.current);
            }

            // Si presionó Enter, procesar código
            if (e.key === 'Enter' && codigoBufferRef.current.length > 0) {
                e.preventDefault();

                const codigo = codigoBufferRef.current.trim();
                codigoBufferRef.current = '';

                if (codigo.length > 2) {
                    setCodigoDetectado(codigo);
                    setProcesando(true);

                    try {
                        await onBarcodeDetected(codigo);
                    } catch (error) {
                        console.error('Error procesando código de barras:', error);
                    } finally {
                        setProcesando(false);
                        setCodigoDetectado('');
                    }
                }
                return;
            }

            // Timeout para resetear el buffer si no hay entrada en 2 segundos
            codigoTimeoutRef.current = setTimeout(() => {
                codigoBufferRef.current = '';
            }, 2000);
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
            if (codigoTimeoutRef.current) {
                clearTimeout(codigoTimeoutRef.current);
            }
        };
    }, [onBarcodeDetected, procesando, enabled]);

    if (!codigoDetectado && !procesando) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-xs z-40">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                    {procesando ? (
                        <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <AlertCircle className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                        <p className="font-semibold text-gray-900 text-sm">
                            {procesando ? 'Procesando código...' : 'Código detectado'}
                        </p>
                        {codigoDetectado && (
                            <p className="text-xs text-gray-600 mt-1 font-mono break-all">
                                {codigoDetectado}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
