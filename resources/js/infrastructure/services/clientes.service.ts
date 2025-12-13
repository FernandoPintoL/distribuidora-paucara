/**
 * ClientesService - Data Layer mejorado con ExtendableService
 *
 * MEJORAS FASE 5.4:
 * - Extiende ExtendableService para hooks de validación
 * - Registra hooks para pre-procesamiento (trim, normalize)
 * - Usa FormValidator para validadores composables
 * - SIN ROMPER: componentes, configuración, especialidades
 *
 * Preservado intacto:
 * - URL builders (indexUrl, createUrl, editUrl, etc.)
 * - loadLocalidadOptions() para cargar localidades
 * - Validación de email + NIT + nombre
 */

import { ExtendableService } from '@/infrastructure/services/extendable.service';
import { FormValidator, Validators } from '@/infrastructure/services/form-validator';
import type { Filters, Id } from '@/domain/entities/shared';
import type { Cliente, ClienteFormData } from '@/domain/entities/clientes';
import type { Localidad } from '@/domain/entities/localidades';
import localidadesService from '@/infrastructure/services/localidades.service';

function buildQuery(params?: { query?: Filters }) {
  const qs = new URLSearchParams();
  const q = params?.query ?? {};
  Object.entries(q).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      qs.append(key, String(value));
    }
  });
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export class ClientesService extends ExtendableService<Cliente, ClienteFormData> {
  private validator: FormValidator<ClienteFormData>;

  constructor() {
    super('clientes');

    // 1️⃣ Configurar validadores composables
    this.validator = new FormValidator<ClienteFormData>()
      .addRule('nombre', Validators.required('Nombre es requerido'))
      .addRule('nombre', Validators.maxLength(255, 'Nombre no puede exceder 255 caracteres'))
      .addRule('email', Validators.email('Formato de email no válido'))
      .addRule('nit', Validators.custom((value) => {
        if (value && String(value).length > 255) {
          return 'NIT no puede exceder 255 caracteres';
        }
        return null;
      }))
      .addRule('localidad_id', Validators.required('Localidad es requerida'));

    // 2️⃣ Hook: Pre-procesamiento antes de validación (trim, normalize)
    this.onBeforeValidate((data) => {
      // Trim espacios en blanco
      if (data.nombre) data.nombre = data.nombre.trim();
      if (data.razon_social) data.razon_social = data.razon_social.trim();

      // Normalizar email (trim + lowercase)
      if (data.email) {
        data.email = data.email.trim().toLowerCase();
      }

      // Trim NIT
      if (data.nit) data.nit = data.nit.trim();

      // Trim teléfono
      if (data.telefono) data.telefono = data.telefono.trim();

      return data;
    });

    // 3️⃣ Hook: Post-validación para logging
    this.onAfterValidate((data, errors) => {
      if (errors.length === 0) {
        console.log('✅ Cliente validado:', data.nombre);
      } else {
        console.warn('⚠️ Errores de validación en cliente:', errors);
      }
      return errors;
    });
  }

  // ============================================
  // URL Builders (SIN CAMBIOS - Preservado)
  // ============================================
  indexUrl(params?: { query?: Filters }) {
    return `/clientes${buildQuery(params)}`;
  }

  createUrl() {
    return '/clientes/create';
  }

  editUrl(id: Id) {
    return `/clientes/${id}/edit`;
  }

  storeUrl() {
    return '/clientes';
  }

  updateUrl(id: Id) {
    return `/clientes/${id}`;
  }

  destroyUrl(id: Id) {
    return `/clientes/${id}`;
  }

  // ============================================
  // Método especial: Cargar opciones de localidades
  // (SIN CAMBIOS - Preservado exacto)
  // ============================================
  async loadLocalidadOptions() {
    try {
      const localidades = await localidadesService.getActiveLocalidades();
      return localidades.map((localidad: Localidad) => ({
        value: localidad.id,
        label: `${localidad.nombre} (${localidad.codigo})`,
      }));
    } catch (error) {
      console.error('Error loading localidad options:', error);
      return [];
    }
  }

  // ============================================
  // Validación: Usa FormValidator composable
  // ============================================
  async validateData(data: ClienteFormData): Promise<string[]> {
    return await this.validator.validateAsync(data);
  }
}

export const clientesService = new ClientesService();
