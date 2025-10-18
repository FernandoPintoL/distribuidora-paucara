// Application Layer: Modern Generic form container with improved design
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import GenericFormFields from '@/presentation/components/generic/generic-form-fields';
import { useGenericForm } from '@/application/hooks/use-generic-form';
import type { BaseEntity, BaseFormData, BaseService, ModuleConfig } from '@/domain/entities/generic';
import { ArrowLeft, Save, RotateCcw, AlertCircle } from 'lucide-react';

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
  // 🆕 Aplicar valores por defecto solo en modo creación (cuando no hay entity)
  const dataWithDefaults = !entity
    ? config.formFields.reduce((acc, field) => {
        // Solo aplicar defaultValue si el campo no tiene ya un valor en initialData
        if (field.defaultValue !== undefined && (acc[field.key] === undefined || acc[field.key] === null)) {
          acc[field.key] = field.defaultValue;
        }
        return acc;
      }, { ...initialData } as F)
    : initialData;

  const {
    data,
    errors,
    processing,
    handleSubmit,
    handleFieldChange,
    handleReset,
    isEditing
  } = useGenericForm(entity, service, dataWithDefaults);

  const pageTitle = isEditing ? `Editar ${config.singularName}` : `Nuevo ${config.singularName}`;
  const submitButtonText = isEditing ? 'Actualizar' : 'Crear';

  // Verificar si hay errores
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <>
      <Head title={pageTitle} />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Error Alert */}
          {hasErrors && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-900 dark:text-red-300">
                    Hay {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 'es' : ''} en el formulario
                  </h3>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                    Por favor, revisa los campos marcados en rojo.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Card */}
          <Card className="shadow-xl border-0 ring-1 ring-gray-200/50 dark:ring-neutral-800/50 backdrop-blur-sm bg-white/95 dark:bg-neutral-900/95">
            <CardHeader className="border-b border-gray-100 dark:border-neutral-800 pb-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-1 bg-primary rounded-full" />
                <div className="flex-1">
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                    {config.displayName}
                  </CardTitle>
                  {config.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {config.description}
                    </p>
                  )}
                </div>
                {processing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Guardando...</span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="py-8 px-6 sm:px-10">
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

                {/* Action Buttons */}
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-8 border-t border-gray-100 dark:border-neutral-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={processing}
                    className="sm:flex-1 h-11 font-medium"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Limpiar formulario
                  </Button>

                  <Button
                    type="submit"
                    disabled={processing}
                    className="sm:flex-1 h-11 font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
                  >
                    {processing ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {submitButtonText} {config.singularName}
                      </>
                    )}
                  </Button>
                </div>

                {/* Help Text */}
                <div className="pt-4 border-t border-gray-50 dark:border-neutral-800/50">
                  <p className="text-xs text-center text-muted-foreground">
                    Los cambios se guardarán inmediatamente después de hacer clic en "{submitButtonText}"
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Back to List Link */}
          <div className="flex justify-center">
            <Link
              href={service.indexUrl()}
              className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al listado de {config.pluralName}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
