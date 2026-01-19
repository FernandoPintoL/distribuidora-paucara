/**
 * Page: Cajas/Dashboard
 *
 * Dashboard administrativo para gestión de cajas de todos los usuarios
 * Responsabilidades:
 * ✅ Mostrar estado de todas las cajas (abierta/cerrada)
 * ✅ Listado de usuarios y sus cajas
 * ✅ Últimos movimientos
 * ✅ Métricas diarias de cajas
 */

import React, { useState } from 'react';
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
import { Pie, Line, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement);

interface Caja {
  id: number;
  user_id: number;
  nombre: string;
  usuario: {
    id: number;
    name: string;
  };
  activa: boolean;
  created_at: string;
  updated_at: string;
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
    montos_cierre: number;
    diferencia: number;
    fecha_cierre: string;
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

  const cajasFiltradas = cajas.filter(
    (caja) =>
      caja.nombre.toLowerCase().includes(search.toLowerCase()) ||
      caja.usuario.name.toLowerCase().includes(search.toLowerCase())
  );

  const obtenerEstadoCaja = (cajaId: number) => {
    const apertura = aperturas_hoy.find((a) => a.caja_id === cajaId);
    if (!apertura) return 'cerrada';
    if (apertura.cierre) return 'cerrada';
    return 'abierta';
  };

  const obtenerMontoCaja = (cajaId: number) => {
    const apertura = aperturas_hoy.find((a) => a.caja_id === cajaId);
    if (!apertura) return 0;
    if (apertura.cierre) return apertura.cierre.montos_cierre;
    return apertura.monto_apertura;
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard de Cajas" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestión de Cajas
              </h1>
              <p className="text-gray-600 mt-2">
                Monitoreo en tiempo real de todas las cajas
              </p>
            </div>
          </div>

          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total de Cajas
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {metricas.total_cajas}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Abiertas Hoy
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {metricas.cajas_abiertas}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Ingresos
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${metricas.total_ingresos.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Egresos
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${Math.abs(metricas.total_egresos).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-red-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Discrepancias
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {metricas.diferencias_detectadas}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Gráfico: Estado de Cajas */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Estado de Cajas
              </h3>
              <div className="flex justify-center">
                <Pie
                  data={{
                    labels: ['Abiertas', 'Cerradas'],
                    datasets: [
                      {
                        label: 'Cajas',
                        data: [metricas.cajas_abiertas, metricas.total_cajas - metricas.cajas_abiertas],
                        backgroundColor: ['#10b981', '#ef4444'],
                        borderColor: ['#059669', '#dc2626'],
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
                      },
                    },
                  }}
                  width={200}
                  height={200}
                />
              </div>
            </Card>

            {/* Gráfico: Ingresos vs Egresos */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Ingresos vs Egresos
              </h3>
              <Bar
                data={{
                  labels: ['Hoy'],
                  datasets: [
                    {
                      label: 'Ingresos',
                      data: [metricas.total_ingresos],
                      backgroundColor: '#10b981',
                    },
                    {
                      label: 'Egresos',
                      data: [Math.abs(metricas.total_egresos)],
                      backgroundColor: '#ef4444',
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
                    },
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                    },
                  },
                }}
                height={200}
              />
            </Card>

            {/* Gráfico: Métrica de Discrepancias */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Resumen del Día
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Cajas Operativas</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {metricas.cajas_abiertas}/{metricas.total_cajas}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Neto del Día</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${(metricas.total_ingresos - Math.abs(metricas.total_egresos)).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Discrepancias</p>
                  <p className={`text-2xl font-bold ${metricas.diferencias_detectadas > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {metricas.diferencias_detectadas}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Búsqueda y filtros */}
          <Card className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre de caja o usuario..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => router.visit('/cajas/reportes')}
                variant="outline"
              >
                <FileText className="mr-2 h-4 w-4" />
                Reportes
              </Button>
            </div>
          </Card>

          {/* Tabla de cajas */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Caja</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Monto Actual</TableHead>
                  <TableHead>Última Actividad</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
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
                      <TableRow key={caja.id}>
                        <TableCell className="font-medium">
                          {caja.nombre}
                        </TableCell>
                        <TableCell>{caja.usuario.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              estado === 'abierta' ? 'default' : 'secondary'
                            }
                          >
                            {estado === 'abierta'
                              ? '🟢 Abierta'
                              : '🔴 Cerrada'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${monto.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {apertura
                            ? format(
                                parseISO(
                                  apertura.cierre?.fecha_cierre ||
                                    apertura.fecha
                                ),
                                'dd MMM HH:mm',
                                { locale: es }
                              )
                            : 'Sin actividad'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              router.visit(`/cajas/${caja.id}`)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-gray-500">
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
