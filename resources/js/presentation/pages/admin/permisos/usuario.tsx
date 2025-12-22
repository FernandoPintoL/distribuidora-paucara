import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import PermisosCheckboxForm from './components/PermisosCheckboxForm';
import { NotificationService } from '@/infrastructure/services/notification.service';
import { getRoleColor } from '@/lib/admin-permisos.utils';
import type { AdminUsuario, PermissionGroup } from '@/domain/entities/admin-permisos';

interface UsuarioEditProps {
  usuario: AdminUsuario;
  permisosActuales: number[];
  rolesActuales: string[];
  todosLosPermisos: PermissionGroup[];
}

export default function UsuarioEdit({ usuario, permisosActuales, rolesActuales, todosLosPermisos }: UsuarioEditProps) {
  const { setData, patch, processing } = useForm({
    permisos: permisosActuales,
  });

  function handlePermisosChange(permisos: number[]) {
    setData('permisos', permisos);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    patch(`/permisos/usuario/${usuario.id}/actualizar`, {
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

          {/* Roles Information */}
          {rolesActuales.length > 0 && (
            <div className="mb-6 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Roles Actuales</h3>
              <div className="flex flex-wrap gap-2">
                {rolesActuales.map(role => (
                  <span
                    key={role}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getRoleColor(role)}`}
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

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
