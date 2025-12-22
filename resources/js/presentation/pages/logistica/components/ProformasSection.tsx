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
        <Card className="dark:bg-slate-900 dark:border-slate-700">
            <CardHeader>
                <CardTitle className="dark:text-white">Proformas App Externa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Filtros */}
                <div className="space-y-4">
                    {/* Búsqueda */}
                    <div>
                        <label className="text-sm font-medium mb-2 block dark:text-gray-300">Buscar</label>
                        <Input
                            placeholder="Número de proforma o cliente..."
                            value={searchProforma}
                            onChange={(e) => setSearchProforma(e.target.value)}
                            className="dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-gray-400"
                        />
                    </div>

                    {/* Filtro de estado */}
                    <div>
                        <label className="text-sm font-medium mb-2 block dark:text-gray-300">Estado</label>
                        <div className="flex flex-wrap gap-2">
                            {estados.map((estado) => (
                                <Button
                                    key={estado}
                                    variant={filtroEstadoProforma === estado ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFiltroEstadoProforma(estado)}
                                    className={`${
                                        estado === 'VENCIDA'
                                            ? 'border-gray-400 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-slate-800'
                                            : estado === 'CONVERTIDA'
                                              ? 'border-blue-400 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-slate-800'
                                              : 'dark:text-gray-300 dark:border-slate-600 dark:hover:bg-slate-800'
                                    }`}
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
                            className="dark:border-slate-600"
                        />
                        <label htmlFor="solo_vencidas" className="text-sm cursor-pointer dark:text-gray-300">
                            Solo vencidas
                        </label>
                    </div>
                </div>

                {/* Información de paginación */}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Mostrando {paginationInfo.from}-{paginationInfo.to} de {paginationInfo.total}
                </div>

                {/* Tabla */}
                <div className="border rounded-lg overflow-x-auto dark:border-slate-700">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-800">
                            <tr className="border-b dark:border-slate-700">
                                <th className="px-4 py-2 text-left font-medium dark:text-gray-300">Número</th>
                                <th className="px-4 py-2 text-left font-medium dark:text-gray-300">Cliente</th>
                                <th className="px-4 py-2 text-left font-medium dark:text-gray-300">Estado</th>
                                <th className="px-4 py-2 text-left font-medium dark:text-gray-300">Monto</th>
                                <th className="px-4 py-2 text-left font-medium dark:text-gray-300">Fecha</th>
                                <th className="px-4 py-2 text-left font-medium dark:text-gray-300">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {proformas.map((proforma) => (
                                <tr key={proforma.id} className="border-t dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                    <td className="px-4 py-2 font-mono text-xs dark:text-gray-300">{proforma.numero}</td>
                                    <td className="px-4 py-2 dark:text-gray-300">{proforma.cliente_nombre}</td>
                                    <td className="px-4 py-2">{getEstadoBadge(proforma.estado, proforma)}</td>
                                    <td className="px-4 py-2 text-right dark:text-gray-300">
                                        Bs {proforma.total.toLocaleString('es-BO', { maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-2 text-xs dark:text-gray-300">
                                        {formatDate(proforma.fecha)}
                                        {estaVencida(proforma) && <div className="text-red-600 dark:text-red-400">VENCIDA</div>}
                                    </td>
                                    <td className="px-4 py-2">
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => onVerProforma(proforma)}
                                                className="dark:hover:bg-slate-700"
                                            >
                                                <Eye className="h-4 w-4 dark:text-gray-400" />
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
