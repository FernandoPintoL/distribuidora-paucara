import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { Badge } from '@/presentation/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table';

// Helper para generar rutas
const route = (name: string, params?: Record<string, unknown> | number | string) => {
  const routes: Record<string, string> = {
    'dashboard': '/dashboard',
    'tipos-precio.index': '/tipos-precio',
    'tipos-precio.edit': '/tipos-precio',
    'productos.edit': '/productos',
  };

  const baseRoute = routes[name] || '/';

  if (params) {
    if ((name === 'tipos-precio.edit' || name === 'productos.edit') && typeof params === 'number') {
      return `${baseRoute}/${params}/edit`;
    }
    // Para otros casos, podrías agregar lógica adicional aquí
  }

  return baseRoute;

  return baseRoute;
};

interface TipoPrecio {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  color: string;
  es_ganancia: boolean;
  es_precio_base: boolean;
  orden: number;
  activo: boolean;
  es_sistema: boolean;
  configuracion: {
    icono?: string;
    tooltip?: string;
    [key: string]: unknown;
  };
}

interface PrecioReciente {
  id: number;
  precio: number;
  nombre: string;
  updated_at: string;
  producto: {
    id: number;
    nombre: string;
  };
}

interface PageProps {
  tipo_precio: TipoPrecio;
  precios_recientes: PrecioReciente[];
  estadisticas: {
    total_precios: number;
    total_configuraciones: number;
    productos_con_precio: number;
  };
}

export default function TipoPrecioShow({ tipo_precio, precios_recientes, estadisticas }: PageProps) {
  const getColorClass = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      pink: 'bg-pink-100 text-pink-800 border-pink-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
      teal: 'bg-teal-100 text-teal-800 border-teal-200',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  return (
    <AppLayout breadcrumbs={[
      { title: 'Dashboard', href: route('dashboard') },
      { title: 'Tipos de Precio', href: route('tipos-precio.index') },
      { title: tipo_precio.nombre, href: '#' }
    ]}>
      <Head title={`Tipo de Precio: ${tipo_precio.nombre}`} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${getColorClass(tipo_precio.color)}`}>
              <span className="text-2xl">{tipo_precio.configuracion.icono || '💰'}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tipo_precio.nombre}</h1>
              <p className="text-gray-600">{tipo_precio.descripcion}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={route('tipos-precio.edit', tipo_precio.id)}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar
              </Link>
            </Button>

            <Button asChild>
              <Link href={route('tipos-precio.index')}>
                Volver
              </Link>
            </Button>
          </div>
        </div>

        {/* Información General */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Código</h4>
                  <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                    {tipo_precio.codigo}
                  </code>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Orden</h4>
                  <p className="text-gray-600">{tipo_precio.orden}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Color</h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-6 h-6 rounded-full border ${getColorClass(tipo_precio.color)}`}></div>
                  <span className="text-gray-600 capitalize">{tipo_precio.color}</span>
                </div>
              </div>

              {tipo_precio.configuracion.tooltip && (
                <div>
                  <h4 className="font-medium text-gray-900">Tooltip</h4>
                  <p className="text-gray-600">{tipo_precio.configuracion.tooltip}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Características</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={tipo_precio.activo ? "default" : "secondary"}>
                  {tipo_precio.activo ? '✓ Activo' : '✗ Inactivo'}
                </Badge>

                {tipo_precio.es_precio_base && (
                  <Badge variant="secondary">
                    📦 Precio Base
                  </Badge>
                )}

                {tipo_precio.es_ganancia && (
                  <Badge variant="secondary">
                    💰 Precio de Ganancia
                  </Badge>
                )}

                {tipo_precio.es_sistema && (
                  <Badge variant="outline">
                    🔒 Tipo del Sistema
                  </Badge>
                )}
              </div>

              {tipo_precio.es_sistema && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500">⚠️</span>
                    <div>
                      <h5 className="font-medium text-amber-800">Tipo del Sistema</h5>
                      <p className="text-sm text-amber-700 mt-1">
                        Este tipo de precio es parte del sistema y tiene restricciones de edición.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total de Precios</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.total_precios}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Productos</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.productos_con_precio}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Configuraciones</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.total_configuraciones}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Precios Recientes */}
        {precios_recientes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Precios Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Nombre del Precio</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-center">Última Actualización</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {precios_recientes.map((precio) => (
                    <TableRow key={precio.id}>
                      <TableCell>
                        <Link
                          href={route('productos.edit', precio.producto.id)}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {precio.producto.nombre}
                        </Link>
                      </TableCell>
                      <TableCell>{precio.nombre}</TableCell>
                      <TableCell className="text-right font-medium">
                        {new Intl.NumberFormat('es-BO', {
                          style: 'currency',
                          currency: 'BOB'
                        }).format(precio.precio)}
                      </TableCell>
                      <TableCell className="text-center">
                        {new Date(precio.updated_at).toLocaleDateString('es-BO', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
