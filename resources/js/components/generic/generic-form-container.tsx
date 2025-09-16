// Application Layer: Generic form container
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GenericFormFields from '@/components/generic/generic-form-fields';
import { useGenericForm } from '@/hooks/use-generic-form';
import type { BaseEntity, BaseFormData, BaseService, ModuleConfig } from '@/domain/generic';

interface GenericFormContainerProps<T extends BaseEntity, F extends BaseFormData> {
  entity?: T | null;
  config: ModuleConfig<T, F>;
  service: BaseService<T, F>;
  initialData: F;
  loadOptions?: (fieldKey: string) => Promise<Array<{ value: string | number; label: string }>>;
  extraData?: Record<string, unknown>;
}

export default function GenericFormContainer<T extends BaseEntity, F extends BaseFormData>({
  entity,
  config,
  service,
  initialData,
  loadOptions,
  extraData
}: GenericFormContainerProps<T, F>) {
  const {
    data,
    errors,
    processing,
    handleSubmit,
    handleFieldChange,
    handleReset,
    isEditing
  } = useGenericForm(entity, service, initialData);

  const pageTitle = isEditing ? `Editar ${config.singularName}` : `Nuevo ${config.singularName}`;
  const submitButtonText = isEditing ? `Actualizar ${config.singularName}` : `Crear ${config.singularName}`;

  return (
    <>
      <Head title={pageTitle} />

      <div className="flex min-h-[80vh] items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 dark:from-neutral-900 dark:to-neutral-800 py-8">
        <Card className="w-full max-w-2xl shadow-2xl border border-gray-200 dark:border-neutral-700 rounded-2xl bg-white dark:bg-neutral-900">
          <CardHeader className="space-y-2 border-b border-gray-100 dark:border-neutral-800 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold tracking-tight text-gray-800 dark:text-white flex items-center gap-2">
                <span className="inline-block w-2 h-6 bg-primary rounded-full mr-2" />
                {pageTitle}
              </CardTitle>
              <Button asChild variant="outline" size="sm" className="border-gray-300 dark:border-neutral-700">
                <Link href={service.indexUrl()}>
                  Volver al listado
                </Link>
              </Button>
            </div>
            {isEditing && entity && (
              <p className="text-sm text-muted-foreground mt-1">
                Editando: <strong>{('nombre' in entity && typeof entity.nombre === 'string') ? entity.nombre : String(entity.id)}</strong>
              </p>
            )}
          </CardHeader>

          <CardContent className="py-8 px-6 sm:px-10">
            {/* Mensaje general de estado */}
            <form onSubmit={handleSubmit} className="space-y-8">
              <GenericFormFields<F>
                data={data}
                errors={errors as Partial<Record<keyof F, string>>}
                fields={config.formFields}
                onChange={handleFieldChange}
                disabled={processing}
                loadOptions={loadOptions}
                extraData={extraData}
              />

              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100 dark:border-neutral-800">
                <Button
                  type="submit"
                  disabled={processing}
                  className="flex-1 py-3 text-base font-semibold shadow-md bg-primary/90 hover:bg-primary text-white rounded-lg transition-all duration-150"
                >
                  {processing ? 'Guardando...' : submitButtonText}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={processing}
                  className="flex-1 py-3 text-base border-gray-300 dark:border-neutral-700 rounded-lg"
                >
                  Limpiar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
