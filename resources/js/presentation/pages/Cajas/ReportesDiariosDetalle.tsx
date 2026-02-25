/**
 * Page: Cajas/ReportesDiariosDetalle
 *
 * Página de detalle completo de un cierre de caja
 * Muestra todos los movimientos entre apertura y cierre con filtros interactivos
 */

import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
  ArrowLeft,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Search,
  X,
  Printer,
} from 'lucide-react';
import { OutputSelectionModal, type TipoDocumento } from '@/presentation/components/impresion/OutputSelectionModal';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table';
import { Badge } from '@/presentation/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface TipoOperacion {
  id: number;
  codigo: string;
  nombre: string;
}

interface Movimiento {
  id: number;
  fecha: string;
  usuario: {
    id: number;
    name: string;
  };
  tipo_operacion: {
    codigo: string;
    nombre: string;
  };
  numero_documento: string;
  monto: number;
  observaciones?: string;
  venta_id?: number;
  pago_id?: number;
}

interface TotalPorTipo {
  codigo: string;
  nombre: string;
  cantidad: number;
  total: number;
}

interface Cierre {
  id: number;
  usuario_id: number;
  usuario: {
    id: number;
    name: string;
  };
  caja: {
    id: number;
    nombre: string;
  };
  fecha_apertura: string;
  fecha_cierre: string;
  monto_apertura: number;
  monto_esperado: number;
  monto_real: number;
  diferencia: number;
}

interface Props {
  cierre: Cierre;
  movimientos: Movimiento[];
  totales_por_tipo: TotalPorTipo[];
  tipos_operacion: TipoOperacion[];
}

export default function ReportesDiariosDetalle({
  cierre,
  movimientos,
  totales_por_tipo,
  tipos_operacion,
}: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Cajas', href: '/cajas' },
    { title: 'Reportes Diarios', href: '/cajas/admin/reportes-diarios' },
    { title: `Cierre #${cierre.id}`, href: '#' },
  ];

  // ===== FILTROS =====
  const [tiposSeleccionados, setTiposSeleccionados] = useState<string[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [montoMin, setMontoMin] = useState<number | null>(null);
  const [montoMax, setMontoMax] = useState<number | null>(null);

  // ===== MODAL DE SALIDA (Impresión/Descarga) =====
  const [isOutputModalOpen, setIsOutputModalOpen] = useState(false);
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState<Movimiento | null>(null);

  const abrirModalImpresion = (movimiento: Movimiento) => {
    setMovimientoSeleccionado(movimiento);
    setIsOutputModalOpen(true);
  };

  const cerrarModalImpresion = () => {
    setIsOutputModalOpen(false);
    setMovimientoSeleccionado(null);
  };

  // Mapear tipo de operación a TipoDocumento
  const getTipoDocumento = (tipoOperacion: string): TipoDocumento => {
    const tipoMap: Record<string, TipoDocumento> = {
      'VENTA': 'movimiento',
      'PAGO': 'pago',
      'GASTO': 'movimiento',
      'AJUSTE': 'movimiento',
      'COMPRA': 'compra',
      'CREDITO': 'movimiento',
      'INGRESO': 'movimiento',
      'EGRESO': 'movimiento',
    };
    return tipoMap[tipoOperacion.toUpperCase()] || 'movimiento';
  };

  // ===== LÓGICA DE FILTRADO =====
  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((mov) => {
      // Filtro por tipo de operación
      if (tiposSeleccionados.length > 0) {
        if (!tiposSeleccionados.includes(mov.tipo_operacion.codigo)) {
          return false;
        }
      }

      // Filtro por búsqueda (documento)
      if (busqueda.trim()) {
        const searchLower = busqueda.toLowerCase();
        if (!mov.numero_documento.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Filtro por rango de montos
      if (montoMin !== null && Math.abs(mov.monto) < montoMin) {
        return false;
      }
      if (montoMax !== null && Math.abs(mov.monto) > montoMax) {
        return false;
      }

      return true;
    });
  }, [movimientos, tiposSeleccionados, busqueda, montoMin, montoMax]);

  // ===== TOTALES FILTRADOS =====
  const totalIngresos = movimientosFiltrados
    .filter((m) => m.monto > 0)
    .reduce((sum, m) => sum + m.monto, 0);

  const totalEgresos = movimientosFiltrados
    .filter((m) => m.monto < 0)
    .reduce((sum, m) => sum + m.monto, 0);

  const totalNeto = totalIngresos + totalEgresos;

  const toggleTipo = (codigo: string) => {
    setTiposSeleccionados((prev) =>
      prev.includes(codigo) ? prev.filter((t) => t !== codigo) : [...prev, codigo]
    );
  };

  const limpiarFiltros = () => {
    setTiposSeleccionados([]);
    setBusqueda('');
    setMontoMin(null);
    setMontoMax(null);
  };

  const descargarFiltrado = () => {
    // Construir los parámetros de query
    const params = new URLSearchParams();

    if (tiposSeleccionados.length > 0) {
      params.append('tipos', tiposSeleccionados.join(','));
    }
    if (busqueda.trim()) {
      params.append('busqueda', busqueda.trim());
    }
    if (montoMin !== null) {
      params.append('monto_min', montoMin.toString());
    }
    if (montoMax !== null) {
      params.append('monto_max', montoMax.toString());
    }

    params.append('formato', 'A4');

    // Redirigir a la descarga
    window.location.href = `/cajas/admin/reportes-diarios/${cierre.id}/descargar-filtrado?${params.toString()}`;
  };

  const tieneFiltrantes = tiposSeleccionados.length > 0 || busqueda.trim() || montoMin !== null || montoMax !== null;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Cierre de Caja #${cierre.id}`} />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.visit('/cajas/admin/reportes-diarios')}
              className="dark:hover:bg-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Cierre de Caja #{cierre.id}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {cierre.caja.nombre}
              </p>
            </div>
          </div>

          {/* Información General */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Apertura */}
            <Card className="p-6 dark:bg-slate-800 border dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Apertura
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Fecha/Hora
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white mt-1">
                    {format(parseISO(cierre.fecha_apertura), 'dd/MM/yyyy HH:mm:ss', {
                      locale: es,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Monto de Apertura
                  </p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                    Bs. {Number(cierre.monto_apertura).toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>

            {/* Cierre */}
            <Card className="p-6 dark:bg-slate-800 border dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Cierre
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Fecha/Hora
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white mt-1">
                    {format(parseISO(cierre.fecha_cierre), 'dd/MM/yyyy HH:mm:ss', {
                      locale: es,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Ejecutado por
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white mt-1">
                    {cierre.usuario.name}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Resumen de Montos */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 dark:bg-slate-800 border dark:border-slate-700 shadow-sm">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Monto Esperado
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                Bs. {Number(cierre.monto_esperado).toFixed(2)}
              </p>
            </Card>

            <Card className="p-4 dark:bg-slate-800 border dark:border-slate-700 shadow-sm">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Monto Real
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                Bs. {Number(cierre.monto_real).toFixed(2)}
              </p>
            </Card>

            <Card className="p-4 dark:bg-slate-800 border dark:border-slate-700 shadow-sm">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Diferencia
              </p>
              <p
                className={`text-2xl font-bold mt-2 ${cierre.diferencia === 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-orange-600 dark:text-orange-400'
                  }`}
              >
                Bs. {Number(cierre.diferencia).toFixed(2)}
              </p>
            </Card>

            <Card className="p-4 dark:bg-slate-800 border dark:border-slate-700 shadow-sm">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Movimientos
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {movimientosFiltrados.length}
              </p>
            </Card>
          </div>

          {/* Panel de Filtros Mejorado */}
          <Card className="p-6 dark:bg-slate-800 border dark:border-slate-700 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Filtros Avanzados
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Mostrando{' '}
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {movimientosFiltrados.length}
                  </span>{' '}
                  de {movimientos.length} movimientos
                </p>
              </div>
              {(tiposSeleccionados.length > 0 || busqueda || montoMin !== null || montoMax !== null) && (
                <Button
                  onClick={limpiarFiltros}
                  size="sm"
                  variant="outline"
                  className="border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 dark:hover:bg-red-900/20 hover:bg-red-50"
                >
                  <X className="mr-2 h-4 w-4" />
                  Limpiar
                </Button>
              )}
            </div>

            {/* Tags de Filtros Activos */}
            {(tiposSeleccionados.length > 0 || busqueda || montoMin !== null || montoMax !== null) && (
              <div className="mb-6 pb-6 border-b dark:border-slate-700">
                <div className="flex flex-wrap gap-2">
                  {tiposSeleccionados.map((codigo) => {
                    const tipo = tipos_operacion.find((t) => t.codigo === codigo);
                    return (
                      <Badge
                        key={codigo}
                        className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700 py-2 px-3 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                        onClick={() => toggleTipo(codigo)}
                      >
                        {tipo?.nombre}
                        <X className="ml-2 h-3 w-3" />
                      </Badge>
                    );
                  })}
                  {busqueda && (
                    <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700 py-2 px-3 cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/50 transition"
                      onClick={() => setBusqueda('')}
                    >
                      Documento: "{busqueda}"
                      <X className="ml-2 h-3 w-3" />
                    </Badge>
                  )}
                  {montoMin !== null && (
                    <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700 py-2 px-3 cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
                      onClick={() => setMontoMin(null)}
                    >
                      Min: Bs. {montoMin}
                      <X className="ml-2 h-3 w-3" />
                    </Badge>
                  )}
                  {montoMax !== null && (
                    <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-700 py-2 px-3 cursor-pointer hover:bg-orange-200 dark:hover:bg-orange-900/50 transition"
                      onClick={() => setMontoMax(null)}
                    >
                      Max: Bs. {montoMax}
                      <X className="ml-2 h-3 w-3" />
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Búsqueda por documento */}
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3 flex items-center gap-2">
                  <Search className="h-4 w-4 text-blue-500" />
                  Buscar por Documento
                </label>
                <input
                  type="text"
                  placeholder="Ej: FA-001, PC-123, NC-456..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition"
                />
              </div>

              {/* Filtro por tipo de operación */}
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3">
                  Tipo de Operación
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {tipos_operacion.map((tipo) => {
                    const isSelected = tiposSeleccionados.includes(tipo.codigo);
                    return (
                      <button
                        key={tipo.codigo}
                        onClick={() => toggleTipo(tipo.codigo)}
                        className={`p-3 rounded-lg border-2 transition text-sm font-medium text-left ${isSelected
                          ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-500'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="rounded cursor-pointer"
                          />
                          <span>{tipo.nombre}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filtro por rango de montos */}
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-3">
                  Rango de Montos (Bs.)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 block mb-2">Mínimo</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={montoMin ?? ''}
                      onChange={(e) => setMontoMin(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:border-green-500 dark:focus:border-green-400 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 dark:text-gray-400 block mb-2">Máximo</label>
                    <input
                      type="number"
                      placeholder="999999.99"
                      value={montoMax ?? ''}
                      onChange={(e) => setMontoMax(e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm focus:outline-none focus:border-green-500 dark:focus:border-green-400 transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Totales Filtrados */}
          {(tiposSeleccionados.length > 0 || busqueda || montoMin !== null || montoMax !== null) && (
            <Card className="p-4 dark:bg-slate-800 border dark:border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">Ingresos</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    Bs. {totalIngresos.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Egresos</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    Bs. {totalEgresos.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Neto</p>
                  <p
                    className={`text-2xl font-bold ${totalNeto >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                      }`}
                  >
                    Bs. {totalNeto.toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Totales por Tipo de Operación */}
          {totales_por_tipo.length > 0 && (
            <Card className="dark:bg-slate-800 border dark:border-slate-700 overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Resumen por Tipo de Operación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {totales_por_tipo.map((tipo) => (
                    <div
                      key={tipo.codigo}
                      className="p-4 border dark:border-slate-600 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {tipo.nombre}
                        </span>
                        {tipo.total > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : tipo.total < 0 ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      <p
                        className={`text-lg font-bold ${tipo.total > 0
                          ? 'text-green-600 dark:text-green-400'
                          : tipo.total < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-900 dark:text-white'
                          }`}
                      >
                        Bs. {Number(tipo.total).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {tipo.cantidad} operaciones
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Tabla de Movimientos */}
          <Card className="dark:bg-slate-800 border dark:border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="dark:border-slate-700 dark:bg-slate-900">
                  <TableHead className="dark:text-gray-300 font-semibold">ID</TableHead>
                  <TableHead className="dark:text-gray-300 font-semibold">Fecha/Hora</TableHead>
                  <TableHead className="dark:text-gray-300 font-semibold">Usuario</TableHead>
                  <TableHead className="dark:text-gray-300 font-semibold">Tipo de Operación</TableHead>
                  <TableHead className="dark:text-gray-300 font-semibold">Documento</TableHead>
                  <TableHead className="text-right dark:text-gray-300 font-semibold">Monto</TableHead>
                  <TableHead className="dark:text-gray-300 font-semibold">Observaciones</TableHead>
                  <TableHead className="text-center dark:text-gray-300 font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientosFiltrados.length > 0 ? (
                  movimientosFiltrados.map((mov) => (
                    <TableRow
                      key={mov.id}
                      className="dark:border-slate-700 dark:hover:bg-slate-700 transition-colors"
                    >
                      <TableCell className="dark:text-gray-300 text-sm">
                        {mov.id}
                      </TableCell>
                      <TableCell className="dark:text-gray-300 text-sm">
                        {format(parseISO(mov.fecha), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                      </TableCell>
                      <TableCell className="dark:text-gray-300">{mov.usuario.name}</TableCell>
                      <TableCell className="dark:text-gray-300">
                        <Badge
                          variant={mov.monto > 0 ? 'default' : 'secondary'}
                          className={
                            mov.monto > 0
                              ? 'bg-green-600 dark:bg-green-700 text-white'
                              : mov.monto < 0
                                ? 'bg-red-600 dark:bg-red-700 text-white'
                                : ''
                          }
                        >
                          {mov.tipo_operacion.nombre}
                        </Badge>
                      </TableCell>
                      <TableCell className="dark:text-gray-300 text-sm">
                        {mov.numero_documento}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${mov.monto > 0
                          ? 'text-green-600 dark:text-green-400'
                          : mov.monto < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-900 dark:text-white'
                          }`}
                      >
                        {mov.monto > 0 ? '+' : ''}
                        Bs. {Number(mov.monto).toFixed(2)}
                      </TableCell>
                      <TableCell className="dark:text-gray-300 text-sm max-w-xs truncate">
                        {mov.observaciones || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => abrirModalImpresion(mov)}
                          className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition"
                          title="Imprimir/Descargar movimiento"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="dark:border-slate-700">
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No hay movimientos que coincidan con los filtros seleccionados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Botones de descarga */}
          <Card className="p-4 dark:bg-slate-800 border dark:border-slate-700">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Botón de descarga filtrada - solo si hay filtros aplicados */}
              {tieneFiltrantes && (
                <Button
                  onClick={descargarFiltrado}
                  className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white transition flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar Filtrado ({movimientosFiltrados.length})
                </Button>
              )}
              {/* Botón de descarga del cierre completo */}
              <Button
                onClick={() => {
                  window.location.href = `/cajas/admin/reportes-diarios/${cierre.id}/descargar?formato=A4`;
                }}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white transition flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar Completo ({movimientos.length})
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal de Salida/Impresión para cada movimiento */}
      {movimientoSeleccionado && (
        <OutputSelectionModal
          isOpen={isOutputModalOpen}
          onClose={cerrarModalImpresion}
          documentoId={movimientoSeleccionado.id}
          tipoDocumento={getTipoDocumento(movimientoSeleccionado.tipo_operacion.codigo)}
          documentoInfo={{
            numero: movimientoSeleccionado.numero_documento,
            fecha: format(parseISO(movimientoSeleccionado.fecha), 'dd/MM/yyyy HH:mm'),
            monto: movimientoSeleccionado.monto,
          }}
        />
      )}
    </AppLayout>
  );
}
