/**
 * Page: Cajas/Auditoria
 *
 * Panel de auditoría de cajas
 * Responsabilidades:
 * ✅ Historial de intentos sin caja abierta
 * ✅ Alertas de actividad sospechosa
 * ✅ Registro de cambios de estado
 * ✅ Filtros y búsqueda
 */

import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Shield,
  MapPin,
} from 'lucide-react';
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
import { Button } from '@/presentation/components/ui/button';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface RegistroAuditoria {
  id: number;
  user_id: number;
  usuario: string;
  tipo_evento: string;
  descripcion: string;
  ip_address: string;
  user_agent: string;
  detalles?: {
    operacion?: string;
    ruta?: string;
    metodo?: string;
  };
  created_at: string;
  severidad?: 'bajo' | 'medio' | 'alto' | 'crítico';
}

interface Alerta {
  id: number;
  usuario: string;
  tipo: string;
  mensaje: string;
  cantidad_intentos: number;
  fecha: string;
}

interface Props {
  registros: RegistroAuditoria[];
  alertas: Alerta[];
  estadisticas: {
    total_eventos: number;
    eventos_sospechosos: number;
    usuarios_con_intentos: number;
    evento_mas_comun: string;
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
  {
    title: 'Auditoría',
    href: '/cajas/auditoria',
  },
];

const getSeveridadColor = (severidad?: string) => {
  switch (severidad) {
    case 'crítico':
      return 'destructive';
    case 'alto':
      return 'outline';
    case 'medio':
      return 'secondary';
    default:
      return 'default';
  }
};

export default function Auditoria({
  registros,
  alertas,
  estadisticas,
}: Props) {
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroSeveridad, setFiltroSeveridad] = useState('todos');

  const registrosFiltrados = registros.filter(
    (r) =>
      (filtroUsuario === '' ||
        r.usuario.toLowerCase().includes(filtroUsuario.toLowerCase())) &&
      (filtroTipo === 'todos' || r.tipo_evento === filtroTipo) &&
      (filtroSeveridad === 'todos' || r.severidad === filtroSeveridad)
  );

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Auditoría de Cajas" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Auditoría de Cajas
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Monitoreo de eventos y actividad sospechosa
            </p>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Eventos
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {estadisticas.total_eventos}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Eventos Sospechosos
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {estadisticas.eventos_sospechosos}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Usuarios Alertados
                  </p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {estadisticas.usuarios_con_intentos}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-yellow-500" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Evento Más Común
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {estadisticas.evento_mas_comun}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Alertas activas */}
          {alertas.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                ⚠️ Alertas Activas
              </h2>
              {alertas.map((alerta) => (
                <Card
                  key={alerta.id}
                  className="p-4 bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-500"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-yellow-900 dark:text-yellow-200">
                        {alerta.mensaje}
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        Usuario: <span className="font-medium">{alerta.usuario}</span> •{' '}
                        {alerta.cantidad_intentos} intentos en{' '}
                        {format(parseISO(alerta.fecha), 'dd MMM yyyy HH:mm', {
                          locale: es,
                        })}
                      </p>
                    </div>
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Filtros */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-600" />
                <Input
                  placeholder="Buscar usuario..."
                  value={filtroUsuario}
                  onChange={(e) => setFiltroUsuario(e.target.value)}
                  className="pl-10"
                />
              </div>

              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos los eventos</option>
                <option value="INTENTO_SIN_CAJA">Intento sin caja</option>
                <option value="ACCESO_DENEGADO">Acceso denegado</option>
                <option value="CAMBIO_ESTADO">Cambio de estado</option>
                <option value="ERROR_SISTEMA">Error de sistema</option>
              </select>

              <select
                value={filtroSeveridad}
                onChange={(e) => setFiltroSeveridad(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todas severidades</option>
                <option value="bajo">Bajo</option>
                <option value="medio">Medio</option>
                <option value="alto">Alto</option>
                <option value="crítico">Crítico</option>
              </select>
            </div>
          </Card>

          {/* Tabla de registros */}
          <Card>
            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Registros de Auditoría ({registrosFiltrados.length})
              </h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Tipo Evento</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Severidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrosFiltrados.length > 0 ? (
                  registrosFiltrados.map((registro) => (
                    <TableRow key={registro.id}>
                      <TableCell className="text-sm font-medium dark:text-white">
                        {format(
                          parseISO(registro.created_at),
                          'dd MMM HH:mm:ss',
                          { locale: es }
                        )}
                      </TableCell>
                      <TableCell className="text-sm dark:text-gray-300">{registro.usuario}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {registro.tipo_evento}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm dark:text-gray-300">
                        {registro.descripcion}
                      </TableCell>
                      <TableCell className="text-sm font-mono dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-600" />
                          {registro.ip_address}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getSeveridadColor(registro.severidad)}>
                          {registro.severidad?.toUpperCase() || 'INFO'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-gray-500 dark:text-gray-400">
                      Sin registros que coincidan con los filtros
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Leyenda de eventos */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-900">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">
              Leyenda de Eventos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-700 dark:text-blue-300">
              <div>• <strong>INTENTO_SIN_CAJA:</strong> Usuario intentó operación sin caja abierta</div>
              <div>• <strong>ACCESO_DENEGADO:</strong> Acceso rechazado por falta de permisos</div>
              <div>• <strong>CAMBIO_ESTADO:</strong> Cambio en estado de caja</div>
              <div>• <strong>ERROR_SISTEMA:</strong> Error durante operación</div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
