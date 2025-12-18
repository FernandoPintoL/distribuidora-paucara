import { useState, useMemo } from 'react';
import type { Permission, PermissionGroup } from '@/domain/entities/admin-permisos';

interface PermisosCheckboxFormProps {
  permisosActuales: number[];
  todosLosPermisos: PermissionGroup[];
  onPermisosChange: (permisos: number[]) => void;
  themeColor?: 'blue' | 'purple';
}

export default function PermisosCheckboxForm({
  permisosActuales,
  todosLosPermisos,
  onPermisosChange,
  themeColor = 'blue',
}: PermisosCheckboxFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectAll, setSelectAll] = useState(permisosActuales.length === getAllPermissionIds().length);
  const [permisos, setPermisos] = useState<number[]>(permisosActuales);

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
    const newPermisos = permisos.includes(permissionId)
      ? permisos.filter(id => id !== permissionId)
      : [...permisos, permissionId];

    setPermisos(newPermisos);
    setSelectAll(newPermisos.length === getAllPermissionIds().length);
    onPermisosChange(newPermisos);
  }

  function toggleSelectAll() {
    if (selectAll) {
      setPermisos([]);
      setSelectAll(false);
      onPermisosChange([]);
    } else {
      const allIds = getAllPermissionIds();
      setPermisos(allIds);
      setSelectAll(true);
      onPermisosChange(allIds);
    }
  }

  const buttonColorClass = themeColor === 'purple'
    ? 'bg-purple-600 text-white hover:bg-purple-700'
    : 'bg-blue-600 text-white hover:bg-blue-700';

  const borderColorClass = themeColor === 'purple' ? 'border-purple-500' : 'border-blue-500';
  const focusRingClass = themeColor === 'purple' ? 'focus:border-purple-500' : 'focus:border-blue-500';

  return (
    <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
      <div className="mb-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Permisos</h3>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar permisos..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={`flex-1 rounded-md border border-gray-300 dark:border-slate-600 px-3 py-2 focus:outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${focusRingClass}`}
          />
          <button
            type="button"
            onClick={toggleSelectAll}
            className={`whitespace-nowrap rounded-md px-4 py-2 font-medium ${
              selectAll
                ? buttonColorClass
                : 'border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600'
            }`}
          >
            {selectAll ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
          </button>
        </div>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          No se encontraron permisos que coincidan con tu búsqueda
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map(group => (
            <div key={group.module} className={`border-l-4 ${borderColorClass} pl-4`}>
              <h4 className="mb-3 font-semibold text-gray-900 dark:text-white capitalize">
                {group.module.replace(/_/g, ' ')}
              </h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {group.permissions.map(permission => (
                  <label key={permission.id} className="flex cursor-pointer items-start gap-3 rounded p-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={permisos.includes(permission.id)}
                      onChange={() => togglePermission(permission.id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-slate-600 dark:bg-slate-700 accent-blue-600 dark:accent-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{permission.name}</div>
                      {permission.description && (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{permission.description}</div>
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
      <div className="mt-8 border-t dark:border-slate-700 pt-6">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-gray-900 dark:text-white">{permisos.length}</span> de{' '}
          <span className="font-semibold text-gray-900 dark:text-white">{getAllPermissionIds().length}</span> permisos seleccionados
        </div>
      </div>
    </div>
  );
}
