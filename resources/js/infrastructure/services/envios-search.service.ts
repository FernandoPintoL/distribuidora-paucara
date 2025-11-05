// Infrastructure: Servicio para búsquedas en la creación de envíos
import { SelectOption } from '@/presentation/components/ui/search-select';

export interface VentaSearchResult {
  id: number;
  numero_venta: string;
  total: number;
  fecha_venta: string;
  cliente: {
    id: number;
    nombre: string;
    email?: string;
    telefono?: string;
  };
  detalles: Array<{
    id: number;
    cantidad: number;
    precio_unitario: number;
    producto: {
      id: number;
      nombre: string;
      codigo: string;
    };
  }>;
}

export interface VehiculoSearchResult {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  capacidad_carga: number;
  estado: string;
}

export interface ChoferSearchResult {
  id: number;
  name: string;
  email: string;
  telefono?: string;
}

class EnviosSearchService {
  /**
   * Buscar ventas por número o cliente
   */
  async buscarVentas(query: string): Promise<SelectOption[]> {
    if (!query || query.length < 2) return [];

    try {
      const response = await fetch(`/api/ventas?search=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Error en búsqueda de ventas');

      const data = await response.json();
      const ventas = Array.isArray(data.data) ? data.data : data;

      return ventas.map((venta: VentaSearchResult) => ({
        value: venta.id,
        label: `${venta.numero_venta} - ${venta.cliente.nombre}`,
        description: `Bs. ${venta.total}`,
      }));
    } catch (error) {
      console.error('Error buscando ventas:', error);
      return [];
    }
  }

  /**
   * Buscar vehículos por placa o modelo
   */
  async buscarVehiculos(query: string): Promise<SelectOption[]> {
    if (!query || query.length < 2) return [];

    try {
      const response = await fetch(`/api/vehiculos?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Error en búsqueda de vehículos');

      const data = await response.json();
      const vehiculos = Array.isArray(data.data) ? data.data : data;

      return vehiculos.map((vehiculo: VehiculoSearchResult) => ({
        value: vehiculo.id,
        label: vehiculo.placa,
        description: `${vehiculo.marca} ${vehiculo.modelo} - ${vehiculo.capacidad_carga}kg`,
      }));
    } catch (error) {
      console.error('Error buscando vehículos:', error);
      return [];
    }
  }

  /**
   * Buscar choferes por nombre o email
   */
  async buscarChoferes(query: string): Promise<SelectOption[]> {
    if (!query || query.length < 2) return [];

    try {
      const response = await fetch(`/usuarios?search=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Error en búsqueda de choferes');

      const data = await response.json();
      const users = Array.isArray(data.data) ? data.data : data;

      return users
        .filter((user: any) => user.roles?.some((r: any) => ['Chofer', 'Gestor de Logística'].includes(r.name)))
        .map((user: any) => ({
          value: user.id,
          label: user.name,
          description: user.email,
        }));
    } catch (error) {
      console.error('Error buscando choferes:', error);
      return [];
    }
  }

  /**
   * Validar si una fecha es válida (no en el pasado)
   */
  validarFecha(fecha: string): boolean {
    if (!fecha) return false;
    const selectedDate = new Date(fecha);
    const now = new Date();
    now.setHours(now.getHours() - 1); // Permitir 1 hora de buffer
    return selectedDate > now;
  }

  /**
   * Obtener mensaje de error para fecha inválida
   */
  getMensajeFechaInvalida(fecha: string): string {
    if (!fecha) return 'La fecha es requerida';
    const selectedDate = new Date(fecha);
    const now = new Date();
    if (selectedDate <= now) {
      return 'La fecha debe ser mayor a la hora actual';
    }
    return '';
  }
}

export default new EnviosSearchService();
