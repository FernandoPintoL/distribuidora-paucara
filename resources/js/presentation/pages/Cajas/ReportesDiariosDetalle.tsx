/**
 * Page: Cajas/ReportesDiariosDetalle
 *
 * Página de detalle completo de un cierre diario general
 */

import React from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
  ArrowLeft,
  Download,
  FileText,
  CheckCircle2,
} from 'lucide-react';
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

interface CierreDiarioGeneral {
  id: number;
  fecha_ejecucion: string;
  total_cajas_cerradas: number;
  total_cajas_con_discrepancia: number;
  total_monto_esperado: number;
  total_monto_real: number;
  total_diferencias: number;
  detalle_cajas: Array<{
    caja_id: number;
    caja_nombre: string;
    usuario: string;
    monto_esperado: number;
    monto_real: number;
    diferencia: number;
    estado: string;
  }>;
  usuario: {
    name: string;
  };
}

interface Props {
  cierre: CierreDiarioGeneral;
  resumen: any;
}

export default function ReportesDiariosDetalle({ cierre, resumen }: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/dashboard' },
    { title: 'Cajas', href: '/cajas' },
    { title: 'Reportes Diarios', href: '/cajas/admin/reportes-diarios' },
    { title: `Cierre #${cierre.id}`, href: '#' },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Cierre Diario #${cierre.id}`} />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.visit('/cajas/admin/reportes-diarios')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Cierre Diario General #{cierre.id}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {format(parseISO(cierre.fecha_ejecucion), 'EEEE, d MMMM yyyy, HH:mm')}
              </p>
            </div>
          </div>

          {/* Información General */}
          <Card className="p-6 dark:bg-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ejecutado por</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  {cierre.usuario.name}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fecha/Hora</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  {format(parseISO(cierre.fecha_ejecucion), 'dd/MM/yyyy HH:mm:ss')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Estado</p>
                <div className="mt-1">
                  <Badge className="bg-green-600 dark:bg-green-700">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    CONSOLIDADA
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 dark:bg-slate-800">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cajas Cerradas</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {cierre.total_cajas_cerradas}
              </p>
            </Card>

            <Card className="p-4 dark:bg-slate-800">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Con Discrepancias</p>
              <p className={`text-3xl font-bold mt-2 ${
                cierre.total_cajas_con_discrepancia > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {cierre.total_cajas_con_discrepancia}
              </p>
            </Card>

            <Card className="p-4 dark:bg-slate-800">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Esperado</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                ${Number(cierre.total_monto_esperado).toFixed(2)}
              </p>
            </Card>

            <Card className="p-4 dark:bg-slate-800">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Diferencia Total</p>
              <p className={`text-2xl font-bold mt-2 ${
                cierre.total_diferencias === 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-orange-600 dark:text-orange-400'
              }`}>
                ${Number(cierre.total_diferencias).toFixed(2)}
              </p>
            </Card>
          </div>

          {/* Opciones de descarga */}
          <Card className="p-4 dark:bg-slate-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Descargar Reporte</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  window.location.href = `/cajas/admin/reportes-diarios/${cierre.id}/descargar?formato=A4`;
                }}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                <Download className="mr-2 h-4 w-4" />
                PDF A4
              </Button>
              <Button
                onClick={() => {
                  window.location.href = `/cajas/admin/reportes-diarios/${cierre.id}/descargar?formato=TICKET_80`;
                }}
                variant="outline"
                className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Ticket 80mm
              </Button>
              <Button
                onClick={() => {
                  window.location.href = `/cajas/admin/reportes-diarios/${cierre.id}/descargar?formato=TICKET_58`;
                }}
                variant="outline"
                className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Ticket 58mm
              </Button>
            </div>
          </Card>

          {/* Tabla de cajas */}
          <Card className="dark:bg-slate-800">
            <Table>
              <TableHeader>
                <TableRow className="dark:border-slate-700">
                  <TableHead className="dark:text-gray-300">Caja</TableHead>
                  <TableHead className="dark:text-gray-300">Usuario</TableHead>
                  <TableHead className="text-right dark:text-gray-300">Esperado</TableHead>
                  <TableHead className="text-right dark:text-gray-300">Real</TableHead>
                  <TableHead className="text-right dark:text-gray-300">Diferencia</TableHead>
                  <TableHead className="dark:text-gray-300">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cierre.detalle_cajas && cierre.detalle_cajas.length > 0 ? (
                  cierre.detalle_cajas.map((caja, idx) => (
                    <TableRow key={idx} className="dark:border-slate-700">
                      <TableCell className="font-medium dark:text-gray-300">
                        {caja.caja_nombre} (#{caja.caja_id})
                      </TableCell>
                      <TableCell className="dark:text-gray-300">{caja.usuario}</TableCell>
                      <TableCell className="text-right dark:text-gray-300">
                        ${Number(caja.monto_esperado).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right dark:text-gray-300">
                        ${Number(caja.monto_real).toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${
                        caja.diferencia === 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        ${Number(caja.diferencia).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-600 dark:bg-green-700">
                          {caja.estado}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="dark:border-slate-700">
                    <TableCell colSpan={6} className="text-center py-4 text-gray-500 dark:text-gray-400">
                      No hay cajas en este cierre
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
