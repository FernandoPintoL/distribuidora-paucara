import { useState, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

interface Permission {
  id: number;
  name: string;
  description?: string;
  guard_name: string;
}

interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

interface UsuarioEditProps {
  usuario: {
    id: number;
    name: string;
    email: string;
  };
  permisosActuales: number[];
  rolesActuales: string[];
  todosLosPermisos: PermissionGroup[];
}

export default function UsuarioEdit({ usuario, permisosActuales, rolesActuales, todosLosPermisos }: UsuarioEditProps) {
  const { data, setData, patch, processing } = useForm({
    permisos: permisosActuales,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectAll, setSelectAll] = useState(permisosActuales.length === getAllPermissionIds().length);

  function getAllPermissionIds() {
    return todosLosPermisos.flatMap(group => group.permissions.map(p => p.id));
  }

  // Filter groups based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return todosLosPermisos;

    return todosLosPermisos
      .map(group => ({
        ...group,
        permissions: group.permissions.filter(
          p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
               p.description?.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter(group => group.permissions.length > 0);
  }, [searchQuery, todosLosPermisos]);

  function togglePermission(permissionId: number) {
    const newPermisos = data.permisos.includes(permissionId)
      ? data.permisos.filter(id => id !== permissionId)
      : [...data.permisos, permissionId];

    setData('permisos', newPermisos);
    setSelectAll(newPermisos.length === getAllPermissionIds().length);
  }

  function toggleSelectAll() {
    if (selectAll) {
      setData('permisos', []);
      setSelectAll(false);
    } else {
      const allIds = getAllPermissionIds();
      setData('permisos', allIds);
      setSelectAll(true);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    patch(`/permisos/usuario/${usuario.id}/actualizar`, {
      onSuccess: () => {
        window.location.href = '/permisos';
      },
      onError: (errors) => {
        console.error(errors);
        alert('Error al actualizar permisos');
      },
    });
  }

  return (
    <AppLayout>
      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Editar Permisos de Usuario</h1>
            <p className="mt-2 text-gray-600">
              Gestiona los permisos para <span className="font-semibold">{usuario.name}</span> ({usuario.email})
            </p>
          </div>

          {/* Roles Information */}
          {rolesActuales.length > 0 && (
            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Roles Actuales</h3>
              <div className="flex flex-wrap gap-2">
                {rolesActuales.map(role => (
                  <span key={role} className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Permissions Editor */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Permisos</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Buscar permisos..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={toggleSelectAll}
                  className={`whitespace-nowrap rounded-md px-4 py-2 font-medium ${
                    selectAll
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {selectAll ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                </button>
              </div>
            </div>

            {filteredGroups.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No se encontraron permisos que coincidan con tu búsqueda
              </div>
            ) : (
              <div className="space-y-6">
                {filteredGroups.map(group => (
                  <div key={group.module} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="mb-3 font-semibold text-gray-900 capitalize">
                      {group.module.replace(/_/g, ' ')}
                    </h4>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {group.permissions.map(permission => (
                        <label key={permission.id} className="flex cursor-pointer items-start gap-3 rounded p-2 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={data.permisos.includes(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                            className="mt-1 h-4 w-4 rounded border-gray-300"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                            {permission.description && (
                              <div className="mt-1 text-xs text-gray-500">{permission.description}</div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            <div className="mt-8 border-t pt-6">
              <div className="mb-4 text-sm text-gray-600">
                <span className="font-semibold">{data.permisos.length}</span> de{' '}
                <span className="font-semibold">{getAllPermissionIds().length}</span> permisos seleccionados
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={processing}
                  className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {processing ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <a href="/permisos">
                  <button className="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50">
                    Cancelar
                  </button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
