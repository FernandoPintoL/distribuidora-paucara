import { useState } from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table';
import { Badge } from '@/presentation/components/ui/badge';
import { Edit, Trash2, Plus } from 'lucide-react';
import { router } from '@inertiajs/react';
import * as routes from '@/routes/combos';

interface ComboItem {
  id: number;
  nombre: string;
  sku: string;
  precio_venta: number;
  subtotal_costo: number;
  cantidad_items: number;
  activo: boolean;
}

interface CombosIndexProps {
  combos: {
    data: ComboItem[];
    current_page: number;
    last_page: number;
    total: number;
  };
}

export default function CombosIndex({ combos }: CombosIndexProps) {
  const handleDelete = (id: number) => {
    if (confirm('¿Está seguro de que desea eliminar este combo?')) {
      router.delete(routes.destroy(id).url);
    }
  };

  return (
    <AppLayout
      breadcrumbs={[
        { title: 'Dashboard', href: '#' },
        { title: 'Combos', href: routes.index().url },
      ]}
    >
      <div className="space-y-4 p-6">
        {/* Header con botón crear */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Combos de Productos</h1>
            <p className="text-sm text-gray-500 mt-1">
              {combos.total} combo{combos.total !== 1 ? 's' : ''} registrado{combos.total !== 1 ? 's' : ''}
            </p>
          </div>
          <Link href={routes.create().url}>
            <Button className="gap-2">
              <Plus size={18} />
              Nuevo Combo
            </Button>
          </Link>
        </div>

        {/* Tabla de combos */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Combos</CardTitle>
          </CardHeader>
          <CardContent>
            {combos.data.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="text-right">Precio Venta</TableHead>
                      <TableHead className="text-right">Costo Calculado</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {combos.data.map((combo) => (
                      <TableRow key={combo.id}>
                        <TableCell className="font-medium">{combo.nombre}</TableCell>
                        <TableCell>{combo.sku}</TableCell>
                        <TableCell className="text-right">{combo.cantidad_items}</TableCell>
                        <TableCell className="text-right">
                          ${combo.precio_venta.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${combo.subtotal_costo.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={combo.activo ? 'default' : 'secondary'}>
                            {combo.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={routes.edit(combo.id).url}>
                              <Button variant="ghost" size="sm">
                                <Edit size={18} />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(combo.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={18} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No hay combos registrados</p>
                <Link href={routes.create().url}>
                  <Button>Crear primer combo</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
