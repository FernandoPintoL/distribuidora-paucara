import { Link } from '@inertiajs/react';
import { Badge } from '@/presentation/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { formatNumber, getStockStatus } from '@/lib/inventario.utils';
import type { StockPaginatedData } from '@/domain/entities/reportes';

interface StockTableProps {
  stock: StockPaginatedData;
}

export function StockTable({ stock }: StockTableProps) {
  console.log('🔍 StockTable - Datos recibidos del backend:', stock);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock por Producto ({stock.total} registros)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Código</TableHead>
                {/* <TableHead>Categoría</TableHead> */}
                <TableHead>Almacén</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Disponible</TableHead>
                <TableHead className="text-right">Reservada</TableHead>
                {/* <TableHead className="text-right">Min/Max</TableHead> */}
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock.data.map((item) => {
                const stockInfo = getStockStatus(item);
                const Icon = stockInfo.icon;

                return (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/productos/${item.producto.id}/edit`}
                        className="hover:underline"
                      >
                        {item.producto.nombre}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.producto.sku}</TableCell>
                    {/* <TableCell>{item.producto.categoria?.nombre || 'Sin categoría'}</TableCell> */}
                    <TableCell>{item.almacen.nombre}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatNumber(item.cantidad)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-green-600 dark:text-green-400">
                      {formatNumber(item.cantidad_disponible)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-amber-600 dark:text-amber-400">
                      {formatNumber(item.cantidad_reservada)}
                    </TableCell>
                    {/* <TableCell className="text-right text-sm text-muted-foreground">
                      {item.producto.stock_minimo} / {item.producto.stock_maximo}
                    </TableCell> */}
                    <TableCell>
                      <Badge variant={stockInfo.color as "default" | "secondary" | "destructive" | "outline"} className="gap-1">
                        <Icon className="h-3 w-3" />
                        {stockInfo.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {stock.last_page > 1 && (
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {((stock.current_page - 1) * stock.per_page) + 1} a{' '}
              {Math.min(stock.current_page * stock.per_page, stock.total)} de{' '}
              {stock.total} registros
            </div>
            <div className="flex items-center space-x-2">
              {stock.links.map((link, index) => (
                <Button
                  key={index}
                  variant={link.active ? "default" : "outline"}
                  size="sm"
                  disabled={!link.url}
                  onClick={() => link.url && (window.location.href = link.url)}
                  dangerouslySetInnerHTML={{ __html: link.label }}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
