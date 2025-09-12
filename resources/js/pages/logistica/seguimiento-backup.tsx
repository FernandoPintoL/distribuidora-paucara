import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-toastify';
import { 
  MapPin, 
  Clock, 
  Truck, 
  Package, 
  CheckCircle, 
  User,
  Phone,
  AlertCircle
} from 'lucide-react';

interface SeguimientoEnvio {
  id: number;
  envio_id: number;
  estado: string;
  descripcion: string;
  ubicacion?: {
    latitud: number;
    longitud: number;
    direccion?: string;
  };
  fecha: string;
  usuario?: {
    name: string;
  };
}

interface EnvioDetalle {
  id: number;
  numero: string;
  estado: string;
  fecha_programada: string;
  direccion_entrega: string;
  observaciones?: string;
  venta: {
    numero: string;
    total: number;
    cliente: {
      nombre: string;
      telefono: string;
    };
  };
  vehiculo: {
    placa: string;
    marca: string;
    modelo: string;
  };
  chofer: {
    name: string;
    telefono?: string;
  };
  seguimientos: SeguimientoEnvio[];
}

export default function SeguimientoEnvio() {
  const { id } = useParams<{ id: string }>();
  const [envio, setEnvio] = useState<EnvioDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) {
      cargarEnvio();
      // Actualizar cada 30 segundos para seguimiento en tiempo real
      const interval = setInterval(cargarEnvio, 30000);
      return () => clearInterval(interval);
    }
  }, [id]);

  const cargarEnvio = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/envios/${id}/seguimiento`);
      
      if (response.ok) {
        const data = await response.json();
        setEnvio(data);
      } else {
        toast.error('Error al cargar los datos del envío');
      }
    } catch (error) {
      toast.error('Error al cargar los datos del envío');
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const actualizarEstado = async (nuevoEstado: string, descripcion: string) => {
    try {
      const response = await fetch(`/api/envios/${id}/estado`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        body: JSON.stringify({
          estado: nuevoEstado,
          descripcion,
          ubicacion: await obtenerUbicacionActual()
        })
      });

      if (response.ok) {
        toast.success('Estado actualizado correctamente');
        cargarEnvio();
      } else {
        toast.error('Error al actualizar el estado');
      }
    } catch (error) {
      toast.error('Error al actualizar el estado');
      console.error('Error:', error);
    }
  };

  const obtenerUbicacionActual = async () => {
    return new Promise<{ latitud: number; longitud: number } | null>((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitud: position.coords.latitude,
              longitud: position.coords.longitude
            });
          },
          () => resolve(null)
        );
      } else {
        resolve(null);
      }
    });
  };

  const getEstadoBadge = (estado: string) => {
    const configs = {
      'PROGRAMADO': { color: 'bg-blue-100 text-blue-800', icon: Clock },
      'EN_PREPARACION': { color: 'bg-yellow-100 text-yellow-800', icon: Package },
      'EN_TRANSITO': { color: 'bg-orange-100 text-orange-800', icon: Truck },
      'ENTREGADO': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'FALLIDO': { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };
    
    const config = configs[estado as keyof typeof configs];
    const Icon = config?.icon || Clock;
    
    return (
      <Badge className={config?.color || 'bg-gray-100 text-gray-800'}>
        <Icon className="h-3 w-3 mr-1" />
        {estado}
      </Badge>
    );
  };

  const getBotonesAccion = () => {
    if (!envio) return null;

    switch (envio.estado) {
      case 'PROGRAMADO':
        return (
          <Button 
            onClick={() => actualizarEstado('EN_PREPARACION', 'Iniciando preparación del pedido')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Iniciar Preparación
          </Button>
        );
      case 'EN_PREPARACION':
        return (
          <Button 
            onClick={() => actualizarEstado('EN_TRANSITO', 'Pedido en camino hacia el cliente')}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Iniciar Envío
          </Button>
        );
      case 'EN_TRANSITO':
        return (
          <div className="flex gap-2">
            <Button 
              onClick={() => actualizarEstado('ENTREGADO', 'Pedido entregado exitosamente')}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirmar Entrega
            </Button>
            <Button 
              onClick={() => actualizarEstado('FALLIDO', 'No se pudo completar la entrega')}
              variant="destructive"
            >
              Marcar como Fallido
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!envio) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No se encontró el envío</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Seguimiento de Envío</h1>
          <p className="text-muted-foreground">{envio.numero}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={cargarEnvio} 
            variant="outline"
            disabled={refreshing}
          >
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
          {getEstadoBadge(envio.estado)}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Información del Envío */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Información del Envío
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Número de Venta</p>
                <p className="font-semibold">{envio.venta.numero}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="font-semibold">Bs {envio.venta.total}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Cliente</p>
              <div className="flex items-center gap-2 mt-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{envio.venta.cliente.nombre}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{envio.venta.cliente.telefono}</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Dirección de Entrega</p>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{envio.direccion_entrega}</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha Programada</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(envio.fecha_programada).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del Vehículo y Chofer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Vehículo y Chofer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Vehículo</p>
              <p className="font-semibold">
                {envio.vehiculo.marca} {envio.vehiculo.modelo}
              </p>
              <p className="text-sm text-muted-foreground">Placa: {envio.vehiculo.placa}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Chofer</p>
              <div className="flex items-center gap-2 mt-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{envio.chofer.name}</span>
              </div>
              {envio.chofer.telefono && (
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{envio.chofer.telefono}</span>
                </div>
              )}
            </div>

            {envio.observaciones && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Observaciones</p>
                <p className="text-sm">{envio.observaciones}</p>
              </div>
            )}

            <div className="pt-4">
              {getBotonesAccion()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline de Seguimiento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historial de Seguimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          {envio.seguimientos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay registros de seguimiento aún
            </p>
          ) : (
            <div className="space-y-4">
              {envio.seguimientos.map((seguimiento, index) => (
                <div key={seguimiento.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-blue-600' : 'bg-gray-300'
                    }`} />
                    {index < envio.seguimientos.length - 1 && (
                      <div className="w-px h-8 bg-gray-300 mt-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getEstadoBadge(seguimiento.estado)}
                        {seguimiento.usuario && (
                          <span className="text-sm text-muted-foreground">
                            por {seguimiento.usuario.name}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(seguimiento.fecha).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{seguimiento.descripcion}</p>
                    {seguimiento.ubicacion && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {seguimiento.ubicacion.direccion || 
                           `${seguimiento.ubicacion.latitud}, ${seguimiento.ubicacion.longitud}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}