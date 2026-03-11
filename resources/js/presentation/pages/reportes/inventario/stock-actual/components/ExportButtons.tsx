import { Button } from '@/presentation/components/ui/button';
import { Download, FileText, Sheet } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ExportButtonsProps {
    reportType: 'stock-actual' | 'vencimientos' | 'rotacion' | 'movimientos';
    filters?: Record<string, any>;
}

export function ExportButtons({ reportType, filters = {} }: ExportButtonsProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleExportPdf = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                tipo: reportType,
                ...filters,
            });

            const response = await fetch(`/reportes/inventario/export-pdf?${params}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/pdf',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Descargar el PDF
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `reporte_inventario_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('📄 PDF descargado exitosamente');
        } catch (error) {
            console.error('Error descargando PDF:', error);
            toast.error('❌ Error al descargar el PDF');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                tipo: reportType,
                ...filters,
            });

            const response = await fetch(`/reportes/inventario/export?${params}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Aquí puedes procesar los datos con SheetJS o similar
            // Por ahora, simplemente mostramos el mensaje
            toast.success('📊 Datos exportados (implementar descarga Excel)');
        } catch (error) {
            console.error('Error exportando Excel:', error);
            toast.error('❌ Error al exportar');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex gap-2">
            <Button
                onClick={handleExportPdf}
                disabled={isLoading}
                variant="default"
                size="sm"
                className="gap-2"
            >
                <FileText className="w-4 h-4" />
                PDF A4
                <Download className="w-4 h-4 ml-1" />
            </Button>
            <Button
                onClick={handleExportExcel}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="gap-2"
            >
                <Sheet className="w-4 h-4" />
                Excel
                <Download className="w-4 h-4 ml-1" />
            </Button>
        </div>
    );
}
