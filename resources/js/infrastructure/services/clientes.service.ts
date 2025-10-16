// Data Layer: Clientes service
import { GenericService } from '@/infrastructure/services/generic.service';
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

export class ClientesService extends GenericService<Cliente, ClienteFormData> {
  constructor() {
    super('clientes');
  }

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

  // Método para cargar opciones de localidades
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

  validateData(data: ClienteFormData): string[] {
    const errors = super.validateData(data);

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('El formato del email no es válido');
    }

    if (data.nit && String(data.nit).length > 255) {
      errors.push('El NIT no puede exceder 255 caracteres');
    }

    return errors;
  }
}

export const clientesService = new ClientesService();
