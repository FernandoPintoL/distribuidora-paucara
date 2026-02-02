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
    };
}

interface MovimientosTableProps {
    movimientos: MovimientoInventario[];
    isLoading?: boolean;
}

const MovimientosTable: React.FC<MovimientosTableProps> = ({
    movimientos = [],
    isLoading = false
}) => {
    const getTipoColor = (tipo: string) => {
        const colors: Record<string, string> = {
            'ENTRADA': 'bg-green-100 text-green-800',
            'SALIDA': 'bg-red-100 text-red-800',
            'TRANSFERENCIA_ENTRADA': 'bg-blue-100 text-blue-800',
            'TRANSFERENCIA_SALIDA': 'bg-yellow-100 text-yellow-800',
            'AJUSTE': 'bg-purple-100 text-purple-800',
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
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Motivo</TableHead>
                            <TableHead>Usuario</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {movimientos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                    No hay movimientos para mostrar
                                </TableCell>
                            </TableRow>
                        ) : (
                            movimientos.map((movimiento) => (
                                <TableRow key={movimiento.id}>
                                    <TableCell className="font-medium">
                                        {movimiento.referencia || movimiento.numero}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(movimiento.fecha).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getTipoColor(movimiento.tipo)}>
                                            {movimiento.tipo}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{movimiento.producto.nombre}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {movimiento.producto.codigo}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{movimiento.almacen.nombre}</TableCell>
                                    <TableCell>
                                        <span className={
                                            movimiento.cantidad > 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                        }>
                                            {movimiento.cantidad > 0 ? '+' : ''}{movimiento.cantidad}
                                        </span>
                                    </TableCell>
                                    <TableCell>{movimiento.motivo}</TableCell>
                                    <TableCell>{movimiento.usuario.name}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default MovimientosTable;
