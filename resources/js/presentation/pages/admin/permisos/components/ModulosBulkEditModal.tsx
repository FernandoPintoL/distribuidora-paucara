import { useState } from 'react';
import { Button } from '@/presentation/components/ui/button';
import { Label } from '@/presentation/components/ui/label';
import { Input } from '@/presentation/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select';

type OperationType = 'estado' | 'categoria' | 'permisos' | 'visible_dashboard';

interface ModulosBulkEditModalProps {
  cantidad: number;
  selectedIds: Set<number>;
  onClose: () => void;
  onSubmit: (selectedIds: Set<number>, operacion: BulkOperation) => Promise<void>;
  cargando: boolean;
}

type BulkOperation =
  | { tipo: 'estado'; valor: boolean }
  | { tipo: 'categoria'; valor: string }
  | { tipo: 'permisos'; permisos: string[]; accion: 'agregar' | 'reemplazar' | 'eliminar' }
  | { tipo: 'visible_dashboard'; valor: boolean };

export function ModulosBulkEditModal({
  cantidad,
  selectedIds,
  onClose,
  onSubmit,
  cargando,
}: ModulosBulkEditModalProps) {
  const [operacion, setOperacion] = useState<OperationType>('estado');
  const [estadoValor, setEstadoValor] = useState<'activar' | 'desactivar'>('activar');
  const [categoriaValor, setCategoriaValor] = useState('');
  const [dashboardValor, setDashboardValor] = useState<'mostrar' | 'ocultar'>('mostrar');

  const handleSubmit = async () => {
    let bulkOp: BulkOperation;

    switch (operacion) {
      case 'estado':
        bulkOp = { tipo: 'estado', valor: estadoValor === 'activar' };
        break;
      case 'categoria':
        if (!categoriaValor.trim()) {
          alert('Por favor ingresa una categoría');
          return;
        }
        bulkOp = { tipo: 'categoria', valor: categoriaValor };
        break;
      case 'permisos':
        // Este caso será manejado después cuando integrar con PermisosCheckboxForm
        bulkOp = { tipo: 'permisos', permisos: [], accion: 'agregar' };
        break;
      case 'visible_dashboard':
        bulkOp = { tipo: 'visible_dashboard', valor: dashboardValor === 'mostrar' };
        break;
      default:
        return;
    }

    await onSubmit(selectedIds, bulkOp);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Editar {cantidad} módulo{cantidad !== 1 ? 's' : ''}
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Selecciona la operación que deseas aplicar a los módulos seleccionados
        </p>

        {/* Selector de operación */}
        <div className="mb-6">
          <Label htmlFor="operacion">Operación</Label>
          <Select value={operacion} onValueChange={(value) => setOperacion(value as OperationType)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar operación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="estado">Cambiar Estado</SelectItem>
              <SelectItem value="categoria">Cambiar Categoría</SelectItem>
              <SelectItem value="visible_dashboard">Cambiar Visibilidad en Dashboard</SelectItem>
              {/* <SelectItem value="permisos">Asignar Permisos</SelectItem> */}
            </SelectContent>
          </Select>
        </div>

        {/* Estado */}
        {operacion === 'estado' && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Label htmlFor="estado">Estado</Label>
            <Select value={estadoValor} onValueChange={(value) => setEstadoValor(value as 'activar' | 'desactivar')}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activar">Activar Todos</SelectItem>
                <SelectItem value="desactivar">Desactivar Todos</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-blue-700 mt-2">
              Esto {estadoValor === 'activar' ? 'activará' : 'desactivará'} todos los {cantidad} módulos seleccionados
            </p>
          </div>
        )}

        {/* Categoría */}
        {operacion === 'categoria' && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <Label htmlFor="categoria">Nueva Categoría</Label>
            <Input
              id="categoria"
              placeholder="ej: Inventario, Comercial, Reportes..."
              value={categoriaValor}
              onChange={(e) => setCategoriaValor(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-green-700 mt-2">
              Asignará la categoría "{categoriaValor || '(sin especificar)'}" a todos los {cantidad} módulos
            </p>
          </div>
        )}

        {/* Visibilidad en Dashboard */}
        {operacion === 'visible_dashboard' && (
          <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <Label htmlFor="dashboard">Visibilidad en Dashboard</Label>
            <Select
              value={dashboardValor}
              onValueChange={(value) => setDashboardValor(value as 'mostrar' | 'ocultar')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar visibilidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mostrar">Mostrar en Dashboard</SelectItem>
                <SelectItem value="ocultar">Ocultar en Dashboard</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-purple-700 mt-2">
              Los módulos se {dashboardValor === 'mostrar' ? 'mostrarán' : 'ocultarán'} en el dashboard
            </p>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={cargando}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={cargando || (operacion === 'categoria' && !categoriaValor.trim())}
            className="flex-1"
          >
            {cargando ? 'Aplicando...' : 'Aplicar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
