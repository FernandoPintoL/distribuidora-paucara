/**
 * Page: Cajas/Dashboard
 *
 * Dashboard administrativo para gestión de cajas de todos los usuarios
 * Responsabilidades:
 * ✅ Mostrar estado de todas las cajas (abierta/cerrada)
 * ✅ Listado de usuarios y sus cajas
 * ✅ Últimos movimientos
 * ✅ Métricas diarias de cajas
 * ✅ Soporte completo para Dark Mode
 */

import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
  Search,
  Eye,
  FileText,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
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
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement);

interface Caja {
  id: number;
  user_id: number;
  nombre: string;
  usuario: {
    id: number;
    name: string;
  };
  activa?: boolean;
  created_at?: string;
  updated_at?: string;
  cierres_pendientes?: number; // ✅ NUEVO: Cantidad de cierres pendientes
}

interface Apertura {
  id: number;
  caja_id: number;
  user_id: number;
  monto_apertura: number;
  fecha: string;
  created_at: string;
  cierre?: {
    id: number;
    monto_real: number;
    diferencia: number;
    fecha_cierre: string;
    estado?: string; // Estado del cierre (PENDIENTE, CONSOLIDADA, RECHAZADA)
    created_at?: string;
  } | null;
}

interface Props {
  cajas: Caja[];
  aperturas_hoy: Apertura[];
  metricas: {
    total_cajas: number;
    cajas_abiertas: number;
    total_ingresos: number;
    total_egresos: number;
    diferencias_detectadas: number;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Admin',
    href: '/admin/dashboard',
  },
  {
    title: 'Cajas',
    href: '/cajas',
  },
];

export default function Dashboard({
  cajas,
  aperturas_hoy,
  metricas,
}: Props) {
  const [search, setSearch] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'abierta' | 'cerrada'>('todos');
  const [filtroEstadoCierre, setFiltroEstadoCierre] = useState<'todos' | 'pendiente' | 'consolidada' | 'rechazada'>('todos');
  const [soloConDiscrepancias, setSoloConDiscrepancias] = useState(false);
  const [montoMin, setMontoMin] = useState<string>('');
  const [montoMax, setMontoMax] = useState<string>('');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [ordenarPor, setOrdenarPor] = useState<'monto' | 'fecha' | 'usuario' | 'estado'>('fecha');
  const [filtrosVisibles, setFiltrosVisibles] = useState(false);

  // ✅ NUEVO: Detectar cambios de tema en tiempo real
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  // ✅ NUEVO: Colores dinámicos basados en el tema
  const chartColors = {
    light: {
      text: '#111827',
      textSecondary: '#6b7280',
      green: '#10b981',
      greenDark: '#059669',
      red: '#ef4444',
      redDark: '#dc2626',
      blue: '#3b82f6',
      gridBorder: '#e5e7eb',
    },
    dark: {
      text: '#f3f4f6',
      textSecondary: '#9ca3af',
      green: '#34d399',
      greenDark: '#10b981',
      red: '#f87171',
      redDark: '#ef4444',
      blue: '#60a5fa',
      gridBorder: '#374151',
    },
  };

  const colors = isDark ? chartColors.dark : chartColors.light;

  // ✅ Filtrado completo con múltiples criterios
  let cajasFiltradas = cajas.filter((caja) => {
    // 1️⃣ Búsqueda por texto
    if (search) {
      const busqueda = search.toLowerCase();
      const coincide =
        caja.nombre.toLowerCase().includes(busqueda) ||
        caja.usuario.name.toLowerCase().includes(busqueda) ||
        caja.id.toString().includes(busqueda);
      if (!coincide) return false;
    }

    // 2️⃣ Filtro por estado de caja (abierta/cerrada)
    if (filtroEstado !== 'todos') {
      const estado = obtenerEstadoCaja(caja.id);
      if (estado !== filtroEstado) return false;
    }

    // 3️⃣ Filtro por estado del cierre (pendiente/consolidada/rechazada)
    if (filtroEstadoCierre !== 'todos') {
      const apertura = aperturas_hoy.find((a) => a.caja_id === caja.id);
      if (!apertura?.cierre) return false;

      const estadoCierre = apertura.cierre.estado?.toLowerCase() || 'sin-estado';
      if (estadoCierre !== filtroEstadoCierre) return false;
    }

    // 4️⃣ Solo cajas con discrepancias (diferencia != 0)
    if (soloConDiscrepancias) {
      const apertura = aperturas_hoy.find((a) => a.caja_id === caja.id);
      if (!apertura?.cierre || apertura.cierre.diferencia === 0) return false;
    }

    // 5️⃣ Filtro por rango de montos
    if (montoMin || montoMax) {
      const monto = obtenerMontoCaja(caja.id);
      const min = montoMin ? parseFloat(montoMin) : 0;
      const max = montoMax ? parseFloat(montoMax) : Infinity;
      if (!(monto >= min && monto <= max)) return false;
    }

    // 6️⃣ Filtro por rango de fechas
    if (fechaDesde || fechaHasta) {
      const apertura = aperturas_hoy.find((a) => a.caja_id === caja.id);
      if (!apertura) return false;

      const fechaApertura = new Date(apertura.fecha).toISOString().split('T')[0];
      const desde = fechaDesde ? fechaDesde : '1900-01-01';
      const hasta = fechaHasta ? fechaHasta : '2100-12-31';
      if (!(fechaApertura >= desde && fechaApertura <= hasta)) return false;
    }

    return true;
  });

  // 7️⃣ Ordenamiento
  cajasFiltradas = [...cajasFiltradas].sort((a, b) => {
    switch (ordenarPor) {
      case 'monto':
        return obtenerMontoCaja(b.id) - obtenerMontoCaja(a.id);
      case 'fecha': {
        const aApertura = aperturas_hoy.find((ap) => ap.caja_id === a.id);
        const bApertura = aperturas_hoy.find((ap) => ap.caja_id === b.id);
        const aFecha = aApertura ? new Date(aApertura.fecha).getTime() : 0;
        const bFecha = bApertura ? new Date(bApertura.fecha).getTime() : 0;
        return bFecha - aFecha;
      }
      case 'usuario':
        return a.usuario.name.localeCompare(b.usuario.name);
      case 'estado':
        return obtenerEstadoCaja(a.id).localeCompare(obtenerEstadoCaja(b.id));
      default:
        return 0;
    }
  });

  // ✅ MEJORADO: Determinar estado de la caja (abierta/cerrada)
  // Nota: aperturas_hoy ahora incluye aperturas sin cierre de días anteriores
  const obtenerEstadoCaja = (cajaId: number) => {
    const apertura = aperturas_hoy.find((a) => a.caja_id === cajaId);

    // Si no hay apertura registrada -> cerrada
    if (!apertura) {
      return 'cerrada';
    }

    // Si hay apertura Y tiene cierre registrado -> cerrada
    if (apertura.cierre) {
      return 'cerrada';
    }

    // Si hay apertura SIN cierre -> abierta (sin importar si es de hoy o días anteriores)
    return 'abierta';
  };

  const obtenerMontoCaja = (cajaId: number) => {
    const apertura = aperturas_hoy.find((a) => a.caja_id === cajaId);
    if (!apertura) return 0;
    if (apertura.cierre) return Number(apertura.cierre.monto_real) || 0;
    return Number(apertura.monto_apertura) || 0;
  };

  // ✅ NUEVO: Obtener información de última actividad
  const obtenerUltimaActividad = (cajaId: number, cierresPendientes: number) => {
    const apertura = aperturas_hoy.find((a) => a.caja_id === cajaId);

    if (!apertura) {
      return {
        texto: 'Sin actividad',
        tipo: 'vacia'
      };
    }

    // Si hay caja abierta sin cerrar
    if (!apertura.cierre) {
      const horaApertura = new Date(apertura.fecha).toLocaleTimeString('es-BO', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return {
        texto: `⏱️ Abierta a las ${horaApertura}`,
        tipo: 'abierta'
      };
    }

    // Si hay cierre pero también cierres pendientes
    if (cierresPendientes > 0) {
      const horaCierre = new Date(apertura.cierre.created_at || apertura.fecha).toLocaleTimeString('es-BO', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const estado = apertura.cierre.estado ? `[${apertura.cierre.estado}]` : '';
      return {
        texto: `🕐 Cerrada ${horaCierre} ${estado}`,
        tipo: 'cerrada-pendiente'
      };
    }

    // Si hay cierre sin pendientes
    const horaCierre = new Date(apertura.cierre.created_at || apertura.fecha).toLocaleTimeString('es-BO', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const estado = apertura.cierre.estado ? `[${apertura.cierre.estado}]` : '';
    return {
      texto: `✅ Cerrada ${horaCierre} ${estado}`,
      tipo: 'cerrada'
    };
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard de Cajas" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Gestión de Cajas
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Monitoreo en tiempo real de todas las cajas
              </p>
            </div>
          </div>

          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total de Cajas
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metricas.total_cajas}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500 dark:text-blue-400" />
              </div>
            </Card>

            <Card className="p-4 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Abiertas Hoy
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {metricas.cajas_abiertas}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-green-500 dark:text-green-400" />
              </div>
            </Card>

            <Card className="p-4 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Ingresos
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${Number(metricas.total_ingresos).toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 dark:text-green-400" />
              </div>
            </Card>

            <Card className="p-4 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Egresos
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${Math.abs(Number(metricas.total_egresos)).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-red-500 dark:text-red-400" />
              </div>
            </Card>

            <Card className="p-4 dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Discrepancias
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {metricas.diferencias_detectadas}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500 dark:text-red-400" />
              </div>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Gráfico: Estado de Cajas */}
            <Card className="p-6 dark:bg-slate-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Estado de Cajas
              </h3>
              <div className="flex justify-center">
                <Pie
                  data={{
                    labels: ['Abiertas', 'Cerradas'],
                    datasets: [
                      {
                        label: 'Cajas',
                        data: [Number(metricas.cajas_abiertas), Number(metricas.total_cajas) - Number(metricas.cajas_abiertas)],
                        backgroundColor: [colors.green, colors.red],
                        borderColor: [colors.greenDark, colors.redDark],
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          color: colors.text,
                          font: { size: 12 },
                        },
                      },
                    },
                  }}
                  width={200}
                  height={200}
                />
              </div>
            </Card>

            {/* Gráfico: Ingresos vs Egresos */}
            <Card className="p-6 dark:bg-slate-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Ingresos vs Egresos
              </h3>
              <Bar
                data={{
                  labels: ['Hoy'],
                  datasets: [
                    {
                      label: 'Ingresos',
                      data: [Number(metricas.total_ingresos)],
                      backgroundColor: colors.green,
                    },
                    {
                      label: 'Egresos',
                      data: [Math.abs(Number(metricas.total_egresos))],
                      backgroundColor: colors.red,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  indexAxis: 'y',
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: colors.text,
                        font: { size: 12 },
                      },
                    },
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                      ticks: {
                        color: colors.textSecondary,
                      },
                      grid: {
                        color: colors.gridBorder,
                      },
                    },
                    y: {
                      ticks: {
                        color: colors.textSecondary,
                      },
                      grid: {
                        color: colors.gridBorder,
                      },
                    },
                  },
                }}
                height={200}
              />
            </Card>

            {/* Gráfico: Métrica de Discrepancias */}
            <Card className="p-6 dark:bg-slate-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Resumen del Día
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cajas Operativas</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {metricas.cajas_abiertas}/{metricas.total_cajas}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Neto del Día</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${(Number(metricas.total_ingresos) - Math.abs(Number(metricas.total_egresos))).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Discrepancias</p>
                  <p className={`text-2xl font-bold ${metricas.diferencias_detectadas > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {metricas.diferencias_detectadas}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Búsqueda y filtros */}
          <Card className="p-4 dark:bg-slate-800">
            <div className="space-y-4">
              {/* Búsqueda */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    placeholder="Buscar por nombre, usuario o ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
                <Button
                  onClick={() => router.visit('/cajas/reportes')}
                  variant="outline"
                  className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Reportes
                </Button>
                <Button
                  onClick={() => setFiltrosVisibles(!filtrosVisibles)}
                  variant="outline"
                  className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
                >
                  {filtrosVisibles ? '🔼 Ocultar Filtros' : '🔽 Mostrar Filtros'}
                </Button>
              </div>

              {/* Filtros Avanzados */}
              {filtrosVisibles && (
              <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg space-y-4">
                {/* Fila 1: Estado de Caja */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Estado de Caja
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={filtroEstado === 'todos' ? 'default' : 'outline'}
                      onClick={() => setFiltroEstado('todos')}
                      className="dark:text-white"
                    >
                      Todos
                    </Button>
                    <Button
                      size="sm"
                      variant={filtroEstado === 'abierta' ? 'default' : 'outline'}
                      onClick={() => setFiltroEstado('abierta')}
                      className="dark:text-white"
                    >
                      🟢 Abierta
                    </Button>
                    <Button
                      size="sm"
                      variant={filtroEstado === 'cerrada' ? 'default' : 'outline'}
                      onClick={() => setFiltroEstado('cerrada')}
                      className="dark:text-white"
                    >
                      🔴 Cerrada
                    </Button>
                  </div>
                </div>

                {/* Fila 2: Estado del Cierre */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Estado del Cierre
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant={filtroEstadoCierre === 'todos' ? 'default' : 'outline'}
                      onClick={() => setFiltroEstadoCierre('todos')}
                      className="dark:text-white"
                    >
                      Todos
                    </Button>
                    <Button
                      size="sm"
                      variant={filtroEstadoCierre === 'pendiente' ? 'default' : 'outline'}
                      onClick={() => setFiltroEstadoCierre('pendiente')}
                      className="dark:text-white"
                    >
                      ⏳ Pendiente
                    </Button>
                    <Button
                      size="sm"
                      variant={filtroEstadoCierre === 'consolidada' ? 'default' : 'outline'}
                      onClick={() => setFiltroEstadoCierre('consolidada')}
                      className="dark:text-white"
                    >
                      ✅ Consolidada
                    </Button>
                    <Button
                      size="sm"
                      variant={filtroEstadoCierre === 'rechazada' ? 'default' : 'outline'}
                      onClick={() => setFiltroEstadoCierre('rechazada')}
                      className="dark:text-white"
                    >
                      ❌ Rechazada
                    </Button>
                  </div>
                </div>

                {/* Fila 3: Rango de Montos */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Rango de Montos
                  </p>
                  <div className="flex gap-2 flex-wrap items-center">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600 dark:text-gray-400">Min:</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={montoMin}
                        onChange={(e) => setMontoMin(e.target.value)}
                        className="w-24 px-2 py-1 rounded border border-gray-300 dark:border-slate-600 dark:bg-slate-600 dark:text-white text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600 dark:text-gray-400">Max:</label>
                      <input
                        type="number"
                        placeholder="∞"
                        value={montoMax}
                        onChange={(e) => setMontoMax(e.target.value)}
                        className="w-24 px-2 py-1 rounded border border-gray-300 dark:border-slate-600 dark:bg-slate-600 dark:text-white text-sm"
                      />
                    </div>
                    {(montoMin || montoMax) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setMontoMin('');
                          setMontoMax('');
                        }}
                        className="text-xs dark:text-white"
                      >
                        Limpiar
                      </Button>
                    )}
                  </div>
                </div>

                {/* Fila 4: Rango de Fechas */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Rango de Fechas
                  </p>
                  <div className="flex gap-2 flex-wrap items-center">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600 dark:text-gray-400">Desde:</label>
                      <input
                        type="date"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                        className="px-2 py-1 rounded border border-gray-300 dark:border-slate-600 dark:bg-slate-600 dark:text-white text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-600 dark:text-gray-400">Hasta:</label>
                      <input
                        type="date"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                        className="px-2 py-1 rounded border border-gray-300 dark:border-slate-600 dark:bg-slate-600 dark:text-white text-sm"
                      />
                    </div>
                    {(fechaDesde || fechaHasta) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setFechaDesde('');
                          setFechaHasta('');
                        }}
                        className="text-xs dark:text-white"
                      >
                        Limpiar
                      </Button>
                    )}
                  </div>
                </div>

                {/* Fila 5: Ordenamiento y Discrepancias */}
                <div className="flex gap-4 flex-wrap items-end">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Ordenar por
                    </p>
                    <select
                      value={ordenarPor}
                      onChange={(e) => setOrdenarPor(e.target.value as 'monto' | 'fecha' | 'usuario' | 'estado')}
                      className="w-full px-2 py-1 rounded border border-gray-300 dark:border-slate-600 dark:bg-slate-600 dark:text-white text-sm"
                    >
                      <option value="fecha">📅 Por Fecha (más reciente)</option>
                      <option value="monto">💰 Por Monto (mayor primero)</option>
                      <option value="usuario">👤 Por Usuario</option>
                      <option value="estado">📊 Por Estado</option>
                    </select>
                  </div>

                  <Button
                    size="sm"
                    variant={soloConDiscrepancias ? 'default' : 'outline'}
                    onClick={() => setSoloConDiscrepancias(!soloConDiscrepancias)}
                    className="dark:text-white"
                  >
                    ⚠️ Con Discrepancias
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFiltroEstado('todos');
                      setFiltroEstadoCierre('todos');
                      setMontoMin('');
                      setMontoMax('');
                      setFechaDesde('');
                      setFechaHasta('');
                      setOrdenarPor('fecha');
                      setSoloConDiscrepancias(false);
                      setSearch('');
                    }}
                    className="dark:text-white"
                  >
                    ↺ Limpiar Filtros
                  </Button>
                </div>

                {/* Resumen de Filtros */}
                <div className="text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-300 dark:border-slate-600">
                  ✅ Mostrando <strong>{cajasFiltradas.length}</strong> de <strong>{cajas.length}</strong> cajas
                </div>
              </div>
              )}
            </div>
          </Card>

          {/* Tabla de cajas */}
          <Card className="dark:bg-slate-800">
            <Table>
              <TableHeader>
                <TableRow className="dark:border-slate-700">
                  <TableHead className="dark:text-gray-300">Caja</TableHead>
                  <TableHead className="dark:text-gray-300">Usuario</TableHead>
                  <TableHead className="dark:text-gray-300">Estado</TableHead>
                  <TableHead className="dark:text-gray-300">Cierres/Pendientes</TableHead>
                  <TableHead className="dark:text-gray-300">Monto Actual</TableHead>
                  <TableHead className="dark:text-gray-300">Última Actividad</TableHead>
                  <TableHead className="text-right dark:text-gray-300">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cajasFiltradas.length > 0 ? (
                  cajasFiltradas.map((caja) => {
                    const estado = obtenerEstadoCaja(caja.id);
                    const monto = obtenerMontoCaja(caja.id);
                    const apertura = aperturas_hoy.find(
                      (a) => a.caja_id === caja.id
                    );

                    return (
                      <TableRow key={caja.id} className="dark:border-slate-700 hover:dark:bg-slate-700">
                        <TableCell className="font-medium dark:text-white">
                          #{caja.id} | {caja.nombre}
                        </TableCell>
                        <TableCell className="dark:text-gray-300">{caja.usuario.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              estado === 'abierta' ? 'default' : 'secondary'
                            }
                            className="dark:bg-slate-700"
                          >
                            {estado === 'abierta'
                              ? '🟢 Abierta'
                              : '🔴 Cerrada'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {caja.cierres_pendientes && caja.cierres_pendientes > 0 ? (
                            <Badge variant="destructive" className="dark:bg-red-900">
                              ⏳ {caja.cierres_pendientes} pendiente{caja.cierres_pendientes !== 1 ? 's' : ''}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="dark:bg-slate-700">
                              ✅ Sin pendientes
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold dark:text-white">
                          ${monto.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const actividad = obtenerUltimaActividad(caja.id, caja.cierres_pendientes || 0);
                            const colorClasses = {
                              vacia: 'text-gray-500 dark:text-gray-400',
                              abierta: 'text-green-600 dark:text-green-400 font-medium',
                              'cerrada-pendiente': 'text-yellow-600 dark:text-yellow-400 font-medium',
                              cerrada: 'text-blue-600 dark:text-blue-400',
                            };
                            return (
                              <span className={`text-sm ${colorClasses[actividad.tipo as keyof typeof colorClasses]}`}>
                                {actividad.texto}
                              </span>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="dark:hover:bg-slate-600 dark:text-gray-300"
                            onClick={() => {
                              console.log('Navegando a caja del usuario:', caja.user_id);
                              router.visit(`/cajas/user/${caja.user_id}`);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow className="dark:border-slate-700">
                    <TableCell colSpan={7} className="text-center py-4 text-gray-500 dark:text-gray-400">
                      No se encontraron cajas
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
