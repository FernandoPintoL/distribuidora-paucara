import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Checkbox } from '@/presentation/components/ui/checkbox';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { ProformaAppExterna } from '@/domain/entities/logistica';

interface ProformasSectionProps {
    proformas: ProformaAppExterna[];
    paginationInfo: any;
    searchProforma: string;
    setSearchProforma: (value: string) => void;
    filtroEstadoProforma: string;
    setFiltroEstadoProforma: (value: string) => void;
    soloVencidas: boolean;
    setSoloVencidas: (value: boolean) => void;
    cambiarPagina: (page: number) => void;
    onVerProforma: (proforma: ProformaAppExterna) => void;
    getEstadoBadge: (estado: string, proforma: ProformaAppExterna) => any;
    estaVencida: (proforma: ProformaAppExterna) => boolean;
}

export function ProformasSection({
    proformas,
    paginationInfo,
    searchProforma,
    setSearchProforma,
    filtroEstadoProforma,
    setFiltroEstadoProforma,
    soloVencidas,
    setSoloVencidas,
    cambiarPagina,
    onVerProforma,
    getEstadoBadge,
    estaVencida,
}: ProformasSectionProps) {
    const [expandedProformaId, setExpandedProformaId] = useState<number | null>(null);

    const estados = ['TODOS', 'PENDIENTE', 'APROBADA', 'RECHAZADA', 'CONVERTIDA', 'VENCIDA'] as const;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Proformas App Externa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Filtros */}
                <div className="space-y-4">
                    {/* Búsqueda */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Buscar</label>
                        <Input
                            placeholder="Número de proforma o cliente..."
                            value={searchProforma}
                            onChange={(e) => setSearchProforma(e.target.value)}
                        />
                    </div>

                    {/* Filtro de estado */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Estado</label>
                        <div className="flex flex-wrap gap-2">
                            {estados.map((estado) => (
                                <Button
                                    key={estado}
                                    variant={filtroEstadoProforma === estado ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFiltroEstadoProforma(estado)}
                                    className={
                                        estado === 'VENCIDA'
                                            ? 'border-gray-400 text-gray-600 hover:bg-gray-100'
                                            : estado === 'CONVERTIDA'
                                              ? 'border-blue-400 text-blue-600 hover:bg-blue-50'
                                              : ''
                                    }
                                >
                                    {estado === 'VENCIDA' ? '⚫ ' : estado === 'CONVERTIDA' ? '🔵 ' : ''}
                                    {estado}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Checkbox: Solo vencidas */}
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="solo_vencidas"
                            checked={soloVencidas}
                            onCheckedChange={(checked) => setSoloVencidas(checked as boolean)}
                        />
                        <label htmlFor="solo_vencidas" className="text-sm cursor-pointer">
                            Solo vencidas
                        </label>
                    </div>
                </div>

                {/* Información de paginación */}
                <div className="text-sm text-muted-foreground">
                    Mostrando {paginationInfo.from}-{paginationInfo.to} de {paginationInfo.total}
                </div>

                {/* Tabla */}
                <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-muted">
                            <tr>
                                <th className="px-4 py-2 text-left">Número</th>
                                <th className="px-4 py-2 text-left">Cliente</th>
                                <th className="px-4 py-2 text-left">Estado</th>
                                <th className="px-4 py-2 text-left">Monto</th>
                                <th className="px-4 py-2 text-left">Fecha</th>
                                <th className="px-4 py-2 text-left">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {proformas.map((proforma) => (
                                <tr key={proforma.id} className="border-t hover:bg-muted/50">
                                    <td className="px-4 py-2 font-mono text-xs">{proforma.numero}</td>
                                    <td className="px-4 py-2">{proforma.cliente_nombre}</td>
                                    <td className="px-4 py-2">{getEstadoBadge(proforma.estado, proforma)}</td>
                                    <td className="px-4 py-2 text-right">
                                        Bs {proforma.total.toLocaleString('es-BO', { maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-2 text-xs">
                                        {formatDate(proforma.fecha)}
                                        {estaVencida(proforma) && <div className="text-red-600">VENCIDA</div>}
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => onVerProforma(proforma)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cambiarPagina(paginationInfo.current_page - 1)}
                        disabled={paginationInfo.current_page === 1}
                    >
                        <ChevronLeft className="h-4 w-4" /> Anterior
                    </Button>

                    <div className="text-sm text-muted-foreground">
                        Página {paginationInfo.current_page} de {paginationInfo.last_page}
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cambiarPagina(paginationInfo.current_page + 1)}
                        disabled={paginationInfo.current_page === paginationInfo.last_page}
                    >
                        Siguiente <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
