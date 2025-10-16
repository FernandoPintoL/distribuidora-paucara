// Application Layer: Generic hook for form management - Updated with notifications (Fixed)
import { useForm, router } from '@inertiajs/react';
import { useCallback, useEffect } from 'react';
import type { BaseEntity, BaseFormData, BaseService } from '@/domain/entities/generic';
import NotificationService from '@/infrastructure/services/notification.service';

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
      // Filtrar campos de archivo que son strings (rutas) para no enviarlos en actualizaciones
      const entityData = { ...entity };
      const fileFields = ['foto_perfil', 'ci_anverso', 'ci_reverso', 'imagen', 'foto', 'archivo'];

      Object.keys(entityData).forEach((key) => {
        const value = entityData[key as keyof typeof entityData];
        // Si es un campo de archivo y es un string (ruta), no lo ponemos en el formulario
        // Solo guardamos null para que no se envíe al backend
        if (fileFields.some(field => key.includes(field)) && typeof value === 'string') {
          // Guardamos la ruta en un campo especial para preview pero no en el campo real
          (entityData as any)[`${key}_preview`] = value;
          (entityData as any)[key] = null;
        }
      });

      setData((prev) => ({ ...prev, ...entityData } as F));
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
      // Filtrar datos: eliminar campos null/undefined y campos _preview
      const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
        // No enviar campos _preview (solo son para mostrar)
        if (key.endsWith('_preview')) {
          return acc;
        }

        // No enviar campos null o undefined (archivos no cambiados)
        if (value === null || value === undefined) {
          return acc;
        }

        acc[key] = value;
        return acc;
      }, {} as Record<string, unknown>);

      // Detectar si hay archivos nuevos
      const hasNewFiles = Object.values(cleanData).some(value => value instanceof File);

      // LOG: Ver datos que se están enviando
      console.group('🔍 DATOS ENVIADOS AL BACKEND - UPDATE');
      console.log('URL:', service.updateUrl(entity.id));
      console.log('Método: PUT');
      console.log('Datos limpios (sin nulls ni _preview):', cleanData);
      console.log('¿Tiene archivos nuevos?:', hasNewFiles);
      console.log('Content-Type:', hasNewFiles ? 'multipart/form-data' : 'application/json');
      console.groupEnd();

      // Crear promesa para actualización
      const updatePromise = new Promise<void>((resolve, reject) => {
        router.put(service.updateUrl(entity.id), cleanData, {
          // Usar FormData solo si hay archivos nuevos
          forceFormData: hasNewFiles,
          preserveState: true,
          preserveScroll: true,
          onSuccess: () => {
            console.log('✅ Actualización exitosa');
            resolve();
          },
          onError: (serverErrors) => {
            console.error('❌ Error en actualización:', serverErrors);
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
      // LOG: Ver datos que se están enviando
      console.group('🔍 DATOS ENVIADOS AL BACKEND - CREATE');
      console.log('URL:', service.storeUrl());
      console.log('Método: POST');
      console.log('ForceFormData: true');
      console.log('Datos completos:', data);
      console.log('Datos serializados:', JSON.stringify(data, null, 2));
      console.groupEnd();

      // Crear promesa para creación
      const createPromise = new Promise<void>((resolve, reject) => {
        post(service.storeUrl(), {
          forceFormData: true,
          onSuccess: () => {
            console.log('✅ Creación exitosa');
            resolve();
          },
          onError: (serverErrors) => {
            console.error('❌ Error en creación:', serverErrors);
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
  }, [entity, validateForm, post, put, service, data]);

  // Manejar cambios en los campos
  const handleFieldChange = useCallback((field: keyof F, value: unknown) => {
    console.log(`📝 Campo cambiado: ${String(field)} =`, value);
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
