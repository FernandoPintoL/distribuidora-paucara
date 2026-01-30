import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PermisosCheckboxForm from './components/PermisosCheckboxForm';
import { NotificationService } from '@/infrastructure/services/notification.service';
import { getRoleColor } from '@/lib/admin-permisos.utils';
import type { AdminUsuario, PermissionGroup } from '@/domain/entities/admin-permisos';

interface Rol {
  id: number;
  name: string;
  description: string;
}

interface UsuarioEditProps {
  usuario: AdminUsuario;
  permisosActuales: number[];
  rolesActuales: string[];
  todosLosPermisos: PermissionGroup[];
  todosLosRoles: Rol[];
}

export default function UsuarioEdit({ usuario, permisosActuales, rolesActuales, todosLosPermisos, todosLosRoles }: UsuarioEditProps) {
  const { data, setData, patch, processing } = useForm({
    permisos: permisosActuales,
    roles: rolesActuales,
  });

  function handlePermisosChange(permisos: number[]) {
    setData('permisos', permisos);
  }

  function handleRolesChange(roleName: string) {
    if (data.roles.includes(roleName)) {
      setData('roles', data.roles.filter((r: string) => r !== roleName));
    } else {
      setData('roles', [...data.roles, roleName]);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    patch(`/permisos/usuario/${usuario.id}`, {
      onSuccess: () => {
        NotificationService.success('Permisos actualizados correctamente');
        router.visit('/permisos');
      },
      onError: () => {
        NotificationService.error('Error al actualizar permisos');
      },
    });
  }

  return (
    <AppLayout>
      <Head title={`Editar Permisos - ${usuario.name}`} />

      <div className="py-12">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Editar Permisos de Usuario</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Gestiona los permisos para <span className="font-semibold">{usuario.name}</span> ({usuario.email})
            </p>
          </div>

          {/* Roles Editor */}
          <div className="mb-6 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Gestionar Roles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todosLosRoles.map(rol => (
                <label key={rol.name} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={data.roles.includes(rol.name)}
                    onChange={() => handleRolesChange(rol.name)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{rol.name}</p>
                    {rol.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{rol.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Permissions Editor */}
          <form onSubmit={handleSubmit}>
            <PermisosCheckboxForm
              permisosActuales={permisosActuales}
              todosLosPermisos={todosLosPermisos}
              onPermisosChange={handlePermisosChange}
              themeColor="blue"
            />

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={processing}
                className="rounded-md bg-blue-600 dark:bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {processing ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button
                type="button"
                onClick={() => router.visit('/permisos')}
                className="rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
