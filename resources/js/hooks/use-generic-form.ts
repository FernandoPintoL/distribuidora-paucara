// Application Layer: Generic hook for form management - Updated with notifications (Fixed)
import { useForm } from '@inertiajs/react';
import { useCallback, useEffect } from 'react';
import type { BaseEntity, BaseFormData, BaseService } from '@/domain/generic';
import NotificationService from '@/services/notification.service';

export function useGenericForm<T extends BaseEntity, F extends BaseFormData>(
  entity: T | null | undefined,
  service: BaseService<T, F>,
  initialData: F
) {
  const { data, setData, post, put, processing, errors, reset } = useForm<F>(
    entity ? { ...initialData, ...entity } : initialData
  );

  // Sincronizar cuando cambia la entidad (p. ej., al abrir "editar")
  // Esto asegura que el formulario se hidrate con los valores actuales del servidor.
  // También revierte a initialData cuando no hay entidad (modo crear).
  useEffect(() => {
    if (entity) {
      setData((prev) => ({ ...prev, ...entity } as F));
    } else {
      setData(initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity]);

  // Validar datos del formulario con notificaciones
  const validateForm = useCallback(() => {
    const validationErrors = service.validateData(data);

    if (validationErrors.length > 0) {
      validationErrors.forEach((error: string) => {
        NotificationService.error(error);
      });
      return false;
    }

    return true;
  }, [data, service]);

  // Enviar formulario con notificaciones elegantes
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const isEditing = !!entity;
    const entityName = entity && 'nombre' in entity ? String(entity.nombre) : 'registro';

    if (isEditing) {
      // Crear promesa para actualización
      const updatePromise = new Promise<void>((resolve, reject) => {
        put(service.updateUrl(entity.id), {
          forceFormData: true,
          onSuccess: () => {
            resolve();
          },
          onError: (serverErrors) => {
            // Mostrar errores específicos del servidor
            if (serverErrors && typeof serverErrors === 'object') {
              Object.values(serverErrors as unknown as Record<string, string[]>).flat().forEach((error) => {
                NotificationService.error(String(error));
              });
            }
            reject(new Error('Error al actualizar'));
          },
        });
      });

      NotificationService.promise(updatePromise, {
        loading: `Actualizando ${entityName}...`,
        success: `${entityName} actualizado correctamente`,
        error: 'Error al actualizar el registro'
      });
    } else {
      // Crear promesa para creación
      const createPromise = new Promise<void>((resolve, reject) => {
        post(service.storeUrl(), {
          forceFormData: true,
          onSuccess: () => {
            resolve();
          },
          onError: (serverErrors) => {
            // Mostrar errores específicos del servidor
            if (serverErrors && typeof serverErrors === 'object') {
              Object.values(serverErrors as unknown as Record<string, string[]>).flat().forEach((error) => {
                NotificationService.error(String(error));
              });
            }
            reject(new Error('Error al crear'));
          },
        });
      });

      NotificationService.promise(createPromise, {
        loading: 'Creando registro...',
        success: 'Registro creado correctamente',
        error: 'Error al crear el registro'
      });
    }
  }, [entity, validateForm, post, put, service]);

  // Manejar cambios en los campos
  const handleFieldChange = useCallback((field: keyof F, value: unknown) => {
    setData({ ...(data as F), [field]: value } as F);
  }, [setData, data]);

  // Resetear formulario con notificación
  const handleReset = useCallback(() => {
    reset();
    NotificationService.info('Formulario restablecido');
  }, [reset]);

  return {
    // Estado del formulario
    data,
    errors,
    processing,

    // Acciones
    handleSubmit,
    handleFieldChange,
    handleReset,

    // Utilidades
    isEditing: !!entity,
  };
}
