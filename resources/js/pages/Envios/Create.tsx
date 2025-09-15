import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Venta {
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

interface Vehiculo {
    id: number;
    placa: string;
    marca: string;
    modelo: string;
    capacidad_carga: number;
    estado: string;
}

interface Chofer {
    id: number;
    name: string;
    email: string;
    telefono?: string;
}

interface Props {
    ventas: Venta[];
    vehiculos: Vehiculo[];
    choferes: Chofer[];
}

export default function Create({ ventas, vehiculos, choferes }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        venta_id: '',
        vehiculo_id: '',
        chofer_id: '',
        fecha_programada: '',
        direccion_entrega: '',
        observaciones: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/envios');
    };

    const selectedVenta = ventas.find(v => v.id.toString() === data.venta_id);

    return (
        <AppLayout>
            <Head title="Crear Envío" />

            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-900">Crear Nuevo Envío</h1>
                    <Button
                        variant="outline"
                        onClick={() => window.history.back()}
                    >
                        Volver
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Información del Envío */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Información del Envío</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="venta_id">Venta</Label>
                                    <Select value={data.venta_id} onValueChange={(value) => setData('venta_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar venta" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ventas.map((venta) => (
                                                <SelectItem key={venta.id} value={venta.id.toString()}>
                                                    {venta.numero_venta} - {venta.cliente.nombre} (Bs. {venta.total})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.venta_id && (
                                        <p className="text-sm text-red-600 mt-1">{errors.venta_id}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="vehiculo_id">Vehículo</Label>
                                    <Select value={data.vehiculo_id} onValueChange={(value) => setData('vehiculo_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar vehículo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {vehiculos.map((vehiculo) => (
                                                <SelectItem key={vehiculo.id} value={vehiculo.id.toString()}>
                                                    {vehiculo.placa} - {vehiculo.marca} {vehiculo.modelo} ({vehiculo.capacidad_carga}kg)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.vehiculo_id && (
                                        <p className="text-sm text-red-600 mt-1">{errors.vehiculo_id}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="chofer_id">Chofer</Label>
                                    <Select value={data.chofer_id} onValueChange={(value) => setData('chofer_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar chofer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {choferes.map((chofer) => (
                                                <SelectItem key={chofer.id} value={chofer.id.toString()}>
                                                    {chofer.name} - {chofer.email}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.chofer_id && (
                                        <p className="text-sm text-red-600 mt-1">{errors.chofer_id}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="fecha_programada">Fecha Programada</Label>
                                    <Input
                                        id="fecha_programada"
                                        type="datetime-local"
                                        value={data.fecha_programada}
                                        onChange={(e) => setData('fecha_programada', e.target.value)}
                                        className="mt-1"
                                    />
                                    {errors.fecha_programada && (
                                        <p className="text-sm text-red-600 mt-1">{errors.fecha_programada}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="direccion_entrega">Dirección de Entrega</Label>
                                    <Textarea
                                        id="direccion_entrega"
                                        value={data.direccion_entrega}
                                        onChange={(e) => setData('direccion_entrega', e.target.value)}
                                        placeholder="Dirección donde se realizará la entrega"
                                        className="mt-1"
                                        rows={3}
                                    />
                                    {errors.direccion_entrega && (
                                        <p className="text-sm text-red-600 mt-1">{errors.direccion_entrega}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="observaciones">Observaciones</Label>
                                    <Textarea
                                        id="observaciones"
                                        value={data.observaciones}
                                        onChange={(e) => setData('observaciones', e.target.value)}
                                        placeholder="Instrucciones especiales o comentarios"
                                        className="mt-1"
                                        rows={3}
                                    />
                                    {errors.observaciones && (
                                        <p className="text-sm text-red-600 mt-1">{errors.observaciones}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Detalles de la Venta Seleccionada */}
                        {selectedVenta && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detalles de la Venta</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label>Cliente</Label>
                                        <p className="text-sm font-medium">{selectedVenta.cliente.nombre}</p>
                                        {selectedVenta.cliente.telefono && (
                                            <p className="text-sm text-gray-600">{selectedVenta.cliente.telefono}</p>
                                        )}
                                        {selectedVenta.cliente.email && (
                                            <p className="text-sm text-gray-600">{selectedVenta.cliente.email}</p>
                                        )}
                                    </div>

                                    <div>
                                        <Label>Productos</Label>
                                        <div className="space-y-2 mt-2">
                                            {selectedVenta.detalles.map((detalle) => (
                                                <div key={detalle.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                    <div>
                                                        <p className="text-sm font-medium">{detalle.producto.nombre}</p>
                                                        <p className="text-xs text-gray-600">{detalle.producto.codigo}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm">Cant: {detalle.cantidad}</p>
                                                        <p className="text-xs text-gray-600">
                                                            Bs. {detalle.precio_unitario}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t">
                                        <div className="flex justify-between items-center">
                                            <Label>Total de la Venta</Label>
                                            <Badge variant="secondary" className="text-lg">
                                                Bs. {selectedVenta.total}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.history.back()}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creando...' : 'Crear Envío'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}