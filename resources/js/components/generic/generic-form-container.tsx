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
}

export default function GenericFormContainer<T extends BaseEntity, F extends BaseFormData>({
  entity,
  config,
  service,
  initialData
}: GenericFormContainerProps<T, F>) {
  const {
    data,
    errors,
    processing,
    handleSubmit,
    handleFieldChange,
    handleReset,
    isEditing,
  } = useGenericForm(entity, service, initialData);

  const pageTitle = isEditing ? `Editar ${config.singularName}` : `Nuevo ${config.singularName}`;
  const submitButtonText = isEditing ? `Actualizar ${config.singularName}` : `Crear ${config.singularName}`;

  return (
    <>
      <Head title={pageTitle} />

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{pageTitle}</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link href={service.indexUrl()}>
                Volver al listado
              </Link>
            </Button>
          </div>
          {isEditing && entity && (
            <p className="text-sm text-muted-foreground">
              Editando: <strong>{(entity as any).nombre || entity.id}</strong>
            </p>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <GenericFormFields<F>
              data={data}
              errors={errors}
              fields={config.formFields}
              onChange={handleFieldChange}
              disabled={processing}
            />

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="submit"
                disabled={processing}
                className="flex-1"
              >
                {processing ? 'Guardando...' : submitButtonText}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={processing}
              >
                Limpiar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
