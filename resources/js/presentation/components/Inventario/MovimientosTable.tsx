import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/presentation/components/ui/table';
import { Badge } from '@/presentation/components/ui/badge';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MovimientoInventario {
    id: number;
    numero: string;
    fecha: string;
    tipo: string;
    producto: {
        nombre: string;
        codigo: string;
    };
    almacen: {
        nombre: string;
    };
    cantidad: number;
    motivo: string;
    usuario: {
        name: string;
        rol?: string;  // ✅ NUEVO: Agregar rol del usuario
    };
}

interface PaginationInfo {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface MovimientosTableProps {
    movimientos: MovimientoInventario[];
    isLoading?: boolean;
    pagination?: PaginationInfo;
    onPageChange?: (page: number) => void;
}

const MovimientosTable: React.FC<MovimientosTableProps> = ({
    movimientos = [],
    isLoading = false,
    pagination,
    onPageChange
}) => {
    const getTipoColor = (tipo: string) => {
        const colors: Record<string, string> = {
            'ENTRADA': 'bg-green-100 text-green-800',
            'SALIDA': 'bg-red-100 text-red-800',
            'TRANSFERENCIA_ENTRADA': 'bg-blue-100 text-blue-800',
            'TRANSFERENCIA_SALIDA': 'bg-yellow-100 text-yellow-800',
            'AJUSTE': 'bg-purple-100 text-purple-800',
            'RESERVA': 'bg-orange-100 text-orange-800',  // ✅ NUEVO: Color para reservas
        };
        return colors[tipo] || 'bg-gray-100 text-gray-800';
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center text-muted-foreground">
                        Cargando movimientos...
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Número</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead>Almacén</TableHead>
                            <TableHead>Motivo</TableHead>
                            <TableHead>Usuario</TableHead>
                            {/* <TableHead>Rol</TableHead>  {/* ✅ NUEVO: Columna de rol */}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {movimientos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                                    No hay movimientos para mostrar
                                </TableCell>
                            </TableRow>
                        ) : (
                            movimientos.map((movimiento) => (
                                <TableRow key={movimiento.id}>
                                    <TableCell className="font-medium">
                                        #{ movimiento.id } | {movimiento.referencia || movimiento.numero}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(movimiento.fecha).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <p><Badge className={getTipoColor(movimiento.tipo)}>
                                            {movimiento.tipo} 
                                        </Badge></p>
                                        <p className='mt-2'>Cantidad:  <span className={
                                            movimiento.cantidad > 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                        }>
                                            {movimiento.cantidad > 0 ? '+' : ''}{movimiento.cantidad}
                                        </span></p>
                                         
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{movimiento.producto.nombre}</div>
                                            <div className="text-sm text-muted-foreground">
                                                #{movimiento.producto.id} | {movimiento.producto.sku}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{movimiento.almacen.nombre}</TableCell>
                                    <TableCell>{movimiento.motivo}</TableCell>
                                    <TableCell>
                                        <p>{movimiento.usuario.name}</p>
                                        {/* <p>
                                            {movimiento.usuario.rol ? (
                                                <Badge className="bg-blue-100 text-blue-800">
                                                    {movimiento.usuario.rol}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">Sin rol</span>
                                            )}
                                        </p> */}
                                    </TableCell>
                                    {/* <TableCell>
                                         {/* ✅ NUEVO: Mostrar rol del usuario */}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Paginación */}
                {pagination && pagination.last_page > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-muted-foreground">
                            Mostrando <strong>{pagination.from}</strong> a <strong>{pagination.to}</strong> de <strong>{pagination.total}</strong> resultados
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.current_page === 1}
                                onClick={() => onPageChange?.(pagination.current_page - 1)}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => {
                                    // Mostrar solo páginas cercanas a la actual
                                    if (
                                        page === 1 ||
                                        page === pagination.last_page ||
                                        (page >= pagination.current_page - 1 && page <= pagination.current_page + 1)
                                    ) {
                                        return (
                                            <Button
                                                key={page}
                                                variant={page === pagination.current_page ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => onPageChange?.(page)}
                                            >
                                                {page}
                                            </Button>
                                        );
                                    }

                                    // Mostrar puntos suspensivos
                                    if (page === pagination.current_page - 2 || page === pagination.current_page + 2) {
                                        return (
                                            <span key={`dots-${page}`} className="px-2 text-muted-foreground">
                                                ...
                                            </span>
                                        );
                                    }

                                    return null;
                                })}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pagination.current_page === pagination.last_page}
                                onClick={() => onPageChange?.(pagination.current_page + 1)}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default MovimientosTable;
