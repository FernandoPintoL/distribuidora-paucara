/**
 * Componente: Botón de Impresión para Listado de Stock
 *
 * Permite imprimir el listado de stock filtrado en diferentes formatos
 */

import { useState } from 'react';
import { Button } from '@/presentation/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from '@/presentation/components/ui/dropdown-menu';
import { Printer, FileText, Receipt, Eye } from 'lucide-react';

interface StockItem {
    id: number;
    producto_id: number;
    almacen_id: number;
    cantidad: number;
    producto_nombre: string;
    producto_codigo: string;
    producto_sku: string;
    almacen_nombre: string;
}

interface FormatoImpresion {
    formato: string;
    nombre: string;
    descripcion?: string;
}

interface ImprimirStockButtonProps {
    stock: StockItem[];
    almacenFiltro?: string;
    busquedaFiltro?: string;
    className?: string;
    iconOnly?: boolean;
}

const iconosPorFormato: Record<string, typeof FileText> = {
    A4: FileText,
    TICKET_80: Receipt,
    TICKET_58: Receipt,
};

const formatosDefault: FormatoImpresion[] = [
    { formato: 'A4', nombre: 'Hoja Completa (A4)', descripcion: 'Formato estándar A4' },
    { formato: 'TICKET_80', nombre: 'Ticket 80mm', descripcion: 'Impresora térmica 80mm' },
    { formato: 'TICKET_58', nombre: 'Ticket 58mm', descripcion: 'Impresora térmica 58mm' },
];

export function ImprimirStockButton({
    stock,
    almacenFiltro,
    busquedaFiltro,
    className = '',
    iconOnly = false,
}: ImprimirStockButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleImprimir = async (formato: string, accion: 'download' | 'stream' = 'download') => {
        console.log('Iniciando impresión de stock:', { formato, cantidad: stock.length, accion });
        setLoading(true);

        try {
            // Realizar petición POST para guardar datos en sesión
            const response = await fetch('/api/stock/preparar-impresion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    stock,
                    almacen_filtro: almacenFiltro || null,
                    busqueda_filtro: busquedaFiltro || null,
                }),
            });

            if (!response.ok) {
                throw new Error('Error al preparar la impresión');
            }

            // Construir URL de impresión
            const url = `/stock/imprimir?formato=${formato}&accion=${accion}`;

            console.log('URL de impresión generada:', url);

            // Abrir en nueva ventana para stream, o descargar
            if (accion === 'stream') {
                window.open(url, '_blank');
            } else {
                window.location.href = url;
            }

            // Pequeño delay para dar feedback visual
            setTimeout(() => setLoading(false), 1000);
        } catch (error) {
            console.error('Error al imprimir:', error);
            alert('Error al preparar la impresión. Intenta nuevamente.');
            setLoading(false);
        }
    };

    const handlePreview = (formato: string) => {
        handleImprimir(formato, 'stream');
    };

    // No mostrar si no hay stock
    if (stock.length === 0) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {iconOnly ? (
                    <button
                        disabled={loading}
                        className={`inline-flex items-center p-2 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
                        title="Imprimir"
                    >
                        <Printer className="h-4 w-4" />
                    </button>
                ) : (
                    <Button variant="outline" disabled={loading} className={className}>
                        <Printer className="mr-2 h-4 w-4" />
                        {loading ? 'Generando...' : 'Imprimir'}
                    </Button>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Seleccionar formato</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {formatosDefault.map((formato) => {
                    const Icon = iconosPorFormato[formato.formato] || FileText;

                    return (
                        <div key={formato.formato}>
                            <DropdownMenuItem
                                onClick={() => handleImprimir(formato.formato, 'download')}
                                className="cursor-pointer"
                            >
                                <Icon className="mr-2 h-4 w-4" />
                                <div className="flex flex-col">
                                    <span>{formato.nombre}</span>
                                    {formato.descripcion && (
                                        <span className="text-xs text-muted-foreground">
                                            {formato.descripcion}
                                        </span>
                                    )}
                                </div>
                            </DropdownMenuItem>
                        </div>
                    );
                })}

                <DropdownMenuSeparator />

                <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Vista previa
                </DropdownMenuLabel>

                {formatosDefault.map((formato) => (
                    <DropdownMenuItem
                        key={`preview-${formato.formato}`}
                        onClick={() => handlePreview(formato.formato)}
                        className="cursor-pointer text-xs"
                    >
                        <Eye className="mr-2 h-3 w-3" />
                        Preview {formato.formato}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
