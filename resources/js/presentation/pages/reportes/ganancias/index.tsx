import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';

// Helper para generar rutas
const route = (name: string, params?: Record<string, unknown> | number | string) => {
  const routes: Record<string, string> = {
    'dashboard': '/dashboard',
    'reportes.ganancias.index': '/reportes/ganancias',
    'reportes.ganancias.export': '/reportes/ganancias/export',
    'tipos-precio.index': '/tipos-precio',
    'reportes.precios.index': '/reportes/precios',
    'productos.edit': '/productos',
  };

  const baseRoute = routes[name] || '/';

  if (params) {
    if (name === 'productos.edit' && typeof params === 'number') {
      return `${baseRoute}/${params}/edit`;
    }
    // Para otros casos, podrías agregar lógica adicional aquí
  }

  return baseRoute;
};
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select';
import { Badge } from '@/presentation/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table';

const ALL_VALUE = 'all';

interface Ganancia {
  producto: {
    id: number;
    nombre: string;
    categoria?: {
      nombre: string;
    };
  };
  tipo_precio: {
    id: number;
    nombre: string;
    color: string;
    configuracion: {
      icono?: string;
    };
  };
  precio_venta: number;
  precio_costo: number;
  ganancia: number;
  porcentaje_ganancia: number;
  fecha_actualizacion: string;
}

interface PageProps {
  ganancias: Ganancia[];
  estadisticas: {
    total_productos: number;
    ganancia_total: number;
    ganancia_promedio: number;
    porcentaje_promedio: number;
    mejor_ganancia: number;
    peor_ganancia: number;
  };
  filtros: {
    fecha_desde?: string;
    fecha_hasta?: string;
    tipo_precio_id?: number;
    categoria_id?: number;
  };
  tipos_precio: Array<{
    id: number;
    nombre: string;
    color: string;
  }>;
  categorias: Array<{
    id: number;
    nombre: string;
  }>;
  error?: string;
}

export default function ReporteGananciasIndex({
  ganancias,
  estadisticas,
  filtros,
  tipos_precio,
  categorias,
  error
}: PageProps) {
  const [formData, setFormData] = useState({
    fecha_desde: filtros.fecha_desde || '',
    fecha_hasta: filtros.fecha_hasta || '',
    tipo_precio_id: filtros.tipo_precio_id?.toString() || ALL_VALUE,
    categoria_id: filtros.categoria_id?.toString() || ALL_VALUE,
  });

  const handleFilter = () => {
    const paramsRaw = { ...formData } as Record<string, string>;
    if (paramsRaw.tipo_precio_id === ALL_VALUE) delete paramsRaw.tipo_precio_id;
    if (paramsRaw.categoria_id === ALL_VALUE) delete paramsRaw.categoria_id;
    const params = Object.fromEntries(Object.entries(paramsRaw).filter(([, v]) => v !== ''));
    router.get(route('reportes.ganancias.index'), params);
  };

  const exportar = () => {
    const params = Object.fromEntries(
      Object.entries(formData).filter(([, value]) => value !== '')
    );
    window.open(route('reportes.ganancias.export') + '?' + new URLSearchParams(params).toString());
  };

  const getColorClass = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      purple: 'bg-purple-100 text-purple-800',
      orange: 'bg-orange-100 text-orange-800',
      red: 'bg-red-100 text-red-800',
      indigo: 'bg-indigo-100 text-indigo-800',
      pink: 'bg-pink-100 text-pink-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      gray: 'bg-gray-100 text-gray-800',
      teal: 'bg-teal-100 text-teal-800',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  const getGananciaColor = (porcentaje: number) => {
    if (porcentaje >= 30) return 'text-green-600';
    if (porcentaje >= 15) return 'text-green-500';
    if (porcentaje >= 5) return 'text-yellow-600';
    if (porcentaje >= 0) return 'text-orange-600';
    return 'text-red-600';
  };

  if (error) {
    return (
      <AppLayout breadcrumbs={[
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Reportes', href: '#' },
        { title: 'Ganancias', href: '#' }
      ]}>
        <Head title="Reporte de Ganancias" />

        <div className="space-y-6">
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <div className="text-red-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-red-800 mb-2">Error de Configuración</h3>
              <p className="text-red-700 text-sm mb-4">{error}</p>
              <Button asChild>
                <Link href={route('tipos-precio.index')}>
                  Configurar Tipos de Precio
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={[
      { title: 'Dashboard', href: route('dashboard') },
      { title: 'Reportes', href: '#' },
      { title: 'Ganancias', href: '#' }
    ]}>
      <Head title="Reporte de Ganancias" />

      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reporte de Ganancias</h1>
            <p className="text-gray-600">Análisis de rentabilidad por producto y tipo de precio</p>
          </div>

          <div className="flex gap-2">
            <Button onClick={exportar} variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar Excel
            </Button>

            <Button asChild variant="outline">
              <Link href={route('reportes.precios.index')}>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Ver Precios
              </Link>
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{estadisticas.total_productos}</p>
                <p className="text-sm text-gray-600">Productos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('es-BO', {
                    style: 'currency',
                    currency: 'BOB',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(estadisticas.ganancia_total)}
                </p>
                <p className="text-sm text-gray-600">Ganancia Total</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">
                  {new Intl.NumberFormat('es-BO', {
                    style: 'currency',
                    currency: 'BOB',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(estadisticas.ganancia_promedio)}
                </p>
                <p className="text-sm text-gray-600">Ganancia Promedio</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {estadisticas.porcentaje_promedio.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">% Promedio</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-700">
                  {new Intl.NumberFormat('es-BO', {
                    style: 'currency',
                    currency: 'BOB',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(estadisticas.mejor_ganancia)}
                </p>
                <p className="text-sm text-gray-600">Mejor Ganancia</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className={`text-2xl font-bold ${estadisticas.peor_ganancia >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                  {new Intl.NumberFormat('es-BO', {
                    style: 'currency',
                    currency: 'BOB',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(estadisticas.peor_ganancia)}
                </p>
                <p className="text-sm text-gray-600">Peor Ganancia</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label>Fecha Desde</Label>
                <Input
                  type="date"
                  value={formData.fecha_desde}
                  onChange={(e) => setFormData({ ...formData, fecha_desde: e.target.value })}
                />
              </div>

              <div>
                <Label>Fecha Hasta</Label>
                <Input
                  type="date"
                  value={formData.fecha_hasta}
                  onChange={(e) => setFormData({ ...formData, fecha_hasta: e.target.value })}
                />
              </div>

              <div>
                <Label>Tipo de Precio</Label>
                <Select
                  value={formData.tipo_precio_id}
                  onValueChange={(value) => setFormData({ ...formData, tipo_precio_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>Todos los tipos</SelectItem>
                    {tipos_precio.map(tipo => (
                      <SelectItem key={tipo.id} value={tipo.id.toString()}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Categoría</Label>
                <Select
                  value={formData.categoria_id}
                  onValueChange={(value) => setFormData({ ...formData, categoria_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>Todas las categorías</SelectItem>
                    {categorias.map(categoria => (
                      <SelectItem key={categoria.id} value={categoria.id.toString()}>
                        {categoria.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end gap-2">
                <Button onClick={handleFilter} className="flex-1">
                  Filtrar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      fecha_desde: '',
                      fecha_hasta: '',
                      tipo_precio_id: ALL_VALUE,
                      categoria_id: ALL_VALUE,
                    });
                    router.get(route('reportes.ganancias.index'));
                  }}
                >
                  Limpiar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Ganancias */}
        <Card>
          <CardHeader>
            <CardTitle>Análisis de Ganancias</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Tipo de Precio</TableHead>
                  <TableHead className="text-right">Precio Costo</TableHead>
                  <TableHead className="text-right">Precio Venta</TableHead>
                  <TableHead className="text-right">Ganancia</TableHead>
                  <TableHead className="text-right">% Ganancia</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ganancias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No se encontraron datos de ganancia con los filtros seleccionados
                    </TableCell>
                  </TableRow>
                ) : (
                  ganancias.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Link
                          href={route('productos.edit', item.producto.id)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          {item.producto.nombre}
                        </Link>
                      </TableCell>

                      <TableCell>
                        <span className="text-gray-600">
                          {item.producto.categoria?.nombre || 'Sin categoría'}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge className={getColorClass(item.tipo_precio.color)}>
                          <span className="mr-1">
                            {item.tipo_precio.configuracion?.icono || '💰'}
                          </span>
                          {item.tipo_precio.nombre}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right font-medium">
                        {new Intl.NumberFormat('es-BO', {
                          style: 'currency',
                          currency: 'BOB'
                        }).format(item.precio_costo)}
                      </TableCell>

                      <TableCell className="text-right font-medium">
                        {new Intl.NumberFormat('es-BO', {
                          style: 'currency',
                          currency: 'BOB'
                        }).format(item.precio_venta)}
                      </TableCell>

                      <TableCell className={`text-right font-semibold ${item.ganancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {new Intl.NumberFormat('es-BO', {
                          style: 'currency',
                          currency: 'BOB'
                        }).format(item.ganancia)}
                      </TableCell>

                      <TableCell className={`text-right font-bold ${getGananciaColor(item.porcentaje_ganancia)}`}>
                        {item.porcentaje_ganancia.toFixed(1)}%
                      </TableCell>

                      <TableCell className="text-center">
                        {item.porcentaje_ganancia >= 30 && (
                          <Badge className="bg-green-100 text-green-800">🔥 Excelente</Badge>
                        )}
                        {item.porcentaje_ganancia >= 15 && item.porcentaje_ganancia < 30 && (
                          <Badge className="bg-green-50 text-green-700">✅ Bueno</Badge>
                        )}
                        {item.porcentaje_ganancia >= 5 && item.porcentaje_ganancia < 15 && (
                          <Badge className="bg-yellow-50 text-yellow-700">⚠️ Regular</Badge>
                        )}
                        {item.porcentaje_ganancia >= 0 && item.porcentaje_ganancia < 5 && (
                          <Badge className="bg-orange-50 text-orange-700">⚡ Bajo</Badge>
                        )}
                        {item.porcentaje_ganancia < 0 && (
                          <Badge className="bg-red-50 text-red-700">❌ Pérdida</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
