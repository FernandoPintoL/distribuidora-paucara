import { useState, useEffect } from 'react';
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

interface FormatoImpresion {
    formato: string;
    nombre: string;
    descripcion?: string;
}

interface FormatoSelectorProps {
    documentoId: number | string;
    tipoDocumento: 'venta' | 'proforma' | 'envio' | 'reportes-carga';
    formatos?: FormatoImpresion[];
    onPreview?: (formato: string) => void;
    className?: string;
}

const iconosPorFormato: Record<string, typeof FileText> = {
    A4: FileText,
    TICKET_80: Receipt,
    TICKET_58: Receipt,
};

export function FormatoSelector({
    documentoId,
    tipoDocumento,
    formatos,
    onPreview,
    className = '',
}: FormatoSelectorProps) {
    const [loading, setLoading] = useState(false);

    // Formatos por defecto si no se especifican
    const formatosDefault: FormatoImpresion[] = [
        { formato: 'A4', nombre: 'Hoja Completa (A4)', descripcion: 'Formato estándar A4' },
        { formato: 'TICKET_80', nombre: 'Ticket 80mm', descripcion: 'Impresora térmica 80mm' },
        { formato: 'TICKET_58', nombre: 'Ticket 58mm', descripcion: 'Impresora térmica 58mm' },
    ];

    const [formatosDisponibles, setFormatosDisponibles] = useState<FormatoImpresion[]>(
        formatos || formatosDefault
    );

    // Cargar formatos disponibles desde el backend si no se proporcionaron
    useEffect(() => {
        if (!formatos || formatos.length === 0) {
            // Manejar caso especial de reportes-carga (usa /api/)
            const urlFormatos = tipoDocumento === 'reportes-carga'
                ? `/api/reportes-carga/formatos-disponibles`
                : `/${tipoDocumento}s/formatos-disponibles`;

            fetch(urlFormatos)
                .then((res) => {
                    // Verificar si la respuesta es JSON válido
                    const contentType = res.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        return res.json();
                    }
                    throw new Error('Respuesta no es JSON');
                })
                .then((data) => {
                    if (data.success && data.data && data.data.length > 0) {
                        setFormatosDisponibles(data.data);
                    }
                })
                .catch((err) => {
                    console.warn('No se pudieron cargar formatos del servidor, usando formatos por defecto:', err);
                    // Mantener formatos por defecto
                });
        }
    }, [formatos, tipoDocumento]);

    const handleImprimir = (formato: string, accion: 'download' | 'stream' = 'download') => {
        setLoading(true);

        // Manejar caso especial de reportes-carga (usa /api/ y /descargar)
        const url = tipoDocumento === 'reportes-carga'
            ? `/api/reportes-carga/${documentoId}/descargar?formato=${formato}&accion=${accion}`
            : `/${tipoDocumento}s/${documentoId}/imprimir?formato=${formato}&accion=${accion}`;

        // Abrir en nueva ventana para stream, o descargar
        if (accion === 'stream') {
            window.open(url, '_blank');
        } else {
            window.location.href = url;
        }

        // Pequeño delay para dar feedback visual
        setTimeout(() => setLoading(false), 1000);
    };

    const handlePreview = (formato: string) => {
        if (onPreview) {
            onPreview(formato);
        } else {
            // Abrir preview en nueva ventana
            const url = tipoDocumento === 'reportes-carga'
                ? `/api/reportes-carga/${documentoId}/preview?formato=${formato}`
                : `/${tipoDocumento}s/${documentoId}/preview?formato=${formato}`;
            window.open(url, '_blank');
        }
    };

    if (formatosDisponibles.length === 0) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={loading} className={className}>
                    <Printer className="mr-2 h-4 w-4" />
                    {loading ? 'Generando...' : 'Imprimir'}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Seleccionar formato</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {formatosDisponibles.map((formato) => {
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

                {formatosDisponibles.map((formato) => (
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
