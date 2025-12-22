import { Head } from '@inertiajs/react';
import type { PageProps } from '@inertiajs/core';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Textarea } from '@/presentation/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import SearchSelect from '@/presentation/components/ui/search-select';
import { AlertCircle, CheckCircle2, Truck, User, MapPin, Calendar, Clock, Weight } from 'lucide-react';
import type { VentaConDetalles, VehiculoCompleto, ChoferEntrega } from '@/domain/entities/entregas';
import { useEntregasCreate } from '@/application/hooks/use-entregas-create';
import { getMinDateTimeLocal } from '@/lib/entregas.utils';

interface Props extends PageProps {
    ventas: VentaConDetalles[];
    vehiculos: VehiculoCompleto[];
    choferes: ChoferEntrega[];
    ventaPreseleccionada?: number;
}

export default function Create({ ventas, vehiculos, choferes, ventaPreseleccionada }: Props) {
    console.log('=== DEBUG Create Component Props ===');
    console.log('Ventas disponibles para entrega:', ventas.length, ventas);
    console.log('Vehículos disponibles:', vehiculos.length, vehiculos);
    console.log('Choferes disponibles:', choferes.length, choferes);
    console.log('Venta preseleccionada:', ventaPreseleccionada);

    const {
        form: { data, setData, processing, errors },
        fechaError,
        setFechaError,
        selectedVenta,
        selectedVehiculo,
        selectedChofer,
        ventasOptions,
        vehiculosOptions,
        chofersConHistorial,
        isFormValid,
        handleSubmit,
        handleVolver,
    } = useEntregasCreate(ventas, vehiculos, choferes, ventaPreseleccionada);

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Logística', href: '/logistica' },
                { title: 'Entregas', href: '/logistica/entregas' },
                { title: 'Crear', href: '#' },
            ]}
        >
            <Head title="Crear Entrega" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Crear Nueva Entrega</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Completa todos los campos para programar una entrega</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Columna 1: Formulario Principal */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Tarjeta 1: Selección de Venta */}
                            <Card className="border-l-4 border-l-blue-500">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-blue-500" />
                                        <CardTitle className="text-lg">Información de la Venta</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <SearchSelect
                                        id="venta_id"
                                        label="Seleccionar Venta"
                                        placeholder="Busca por número de venta o cliente"
                                        value={data.venta_id}
                                        options={ventasOptions}
                                        onChange={(value) => setData('venta_id', value ? value.toString() : '')}
                                        required
                                        error={errors.venta_id}
                                        allowClear
                                    />
                                </CardContent>
                            </Card>

                            {/* Tarjeta 2: Asignación de Recursos */}
                            <Card className="border-l-4 border-l-amber-500">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2">
                                        <Truck className="h-5 w-5 text-amber-500" />
                                        <CardTitle className="text-lg">Asignación de Recursos</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <SearchSelect
                                        id="vehiculo_id"
                                        label="Vehículo"
                                        placeholder="Busca por placa o modelo"
                                        value={data.vehiculo_id}
                                        options={vehiculosOptions}
                                        onChange={(value) => setData('vehiculo_id', value ? value.toString() : '')}
                                        required
                                        error={errors.vehiculo_id}
                                        allowClear
                                    />

                                    <SearchSelect
                                        id="chofer_id"
                                        label="Chofer"
                                        placeholder="Busca por nombre o email"
                                        value={data.chofer_id}
                                        options={chofersConHistorial}
                                        onChange={(value) => setData('chofer_id', value ? value.toString() : '')}
                                        required
                                        error={errors.chofer_id}
                                        allowClear
                                    />
                                </CardContent>
                            </Card>

                            {/* Tarjeta 3: Detalles de Entrega */}
                            <Card className="border-l-4 border-l-green-500">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-green-500" />
                                        <CardTitle className="text-lg">Detalles de Entrega</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="fecha_programada" className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Fecha y Hora Programada
                                        </Label>
                                        <div className="relative mt-2">
                                            <Input
                                                id="fecha_programada"
                                                type="datetime-local"
                                                value={data.fecha_programada}
                                                onChange={(e) => {
                                                    setData('fecha_programada', e.target.value);
                                                    setFechaError('');
                                                }}
                                                min={getMinDateTimeLocal()}
                                                className={`mt-2 ${fechaError ? 'border-red-500' : ''}`}
                                                required
                                            />
                                            {data.fecha_programada && !fechaError && (
                                                <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600 pointer-events-none" />
                                            )}
                                        </div>
                                        {(errors.fecha_programada || fechaError) && (
                                            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.fecha_programada || fechaError}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Mínimo 1 hora a partir de ahora
                                        </p>
                                    </div>

                                    <div>
                                        <Label htmlFor="direccion_entrega">Dirección de Entrega *</Label>
                                        <Textarea
                                            id="direccion_entrega"
                                            value={data.direccion_entrega}
                                            onChange={(e) => setData('direccion_entrega', e.target.value)}
                                            placeholder="Ej: Av. Siempre Viva 123, Santa Cruz, Bolivia"
                                            className="mt-2"
                                            rows={3}
                                            required
                                        />
                                        {errors.direccion_entrega && (
                                            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.direccion_entrega}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <Label htmlFor="peso_kg" className="flex items-center gap-2">
                                            <Weight className="h-4 w-4" />
                                            Peso de la Carga (kg) *
                                        </Label>
                                        <Input
                                            id="peso_kg"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.peso_kg || ''}
                                            onChange={(e) => setData('peso_kg', e.target.value)}
                                            placeholder="Ej: 50.5"
                                            className="mt-2"
                                            required
                                        />
                                        {selectedVehiculo && data.peso_kg && parseFloat(data.peso_kg) > (selectedVehiculo.capacidad_carga || selectedVehiculo.capacidad_kg || 0) && (
                                            <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                ⚠️ El peso excede la capacidad del vehículo ({selectedVehiculo.capacidad_carga || selectedVehiculo.capacidad_kg} kg)
                                            </p>
                                        )}
                                        {errors.peso_kg && (
                                            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.peso_kg}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Ingresa el peso total de la carga en kilogramos
                                        </p>
                                    </div>

                                    <div>
                                        <Label htmlFor="observaciones">Observaciones (Opcional)</Label>
                                        <Textarea
                                            id="observaciones"
                                            value={data.observaciones}
                                            onChange={(e) => setData('observaciones', e.target.value)}
                                            placeholder="Instrucciones especiales, horarios, contactos adicionales, etc."
                                            className="mt-2"
                                            rows={3}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Columna 2: Panel Lateral de Resumen */}
                        <div className="lg:col-span-1">
                            {/* Resumen de Venta */}
                            {selectedVenta ? (
                                <Card className="sticky top-6 border-2 border-blue-200 dark:border-blue-900">
                                    <CardHeader className="bg-blue-50 dark:bg-blue-950">
                                        <CardTitle className="text-sm">Resumen de la Entrega</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-4">
                                        {/* Cliente */}
                                        <div className="pb-4 border-b">
                                            <p className="text-xs text-muted-foreground uppercase font-semibold">Cliente</p>
                                            <p className="text-sm font-medium mt-1">{selectedVenta.cliente.nombre}</p>
                                            {selectedVenta.cliente.telefono && (
                                                <p className="text-xs text-muted-foreground mt-1">{selectedVenta.cliente.telefono}</p>
                                            )}
                                        </div>

                                        {/* Vehículo */}
                                        {selectedVehiculo && (
                                            <div className="pb-4 border-b">
                                                <p className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1">
                                                    <Truck className="h-3 w-3" />
                                                    Vehículo
                                                </p>
                                                <p className="text-sm font-medium mt-1">{selectedVehiculo.placa}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {selectedVehiculo.marca} {selectedVehiculo.modelo}
                                                </p>
                                                <Badge variant="outline" className="mt-2 text-xs">
                                                    {selectedVehiculo.capacidad_carga || selectedVehiculo.capacidad_kg || 0}kg
                                                </Badge>
                                            </div>
                                        )}

                                        {/* Chofer */}
                                        {selectedChofer && (
                                            <div className="pb-4 border-b">
                                                <p className="text-xs text-muted-foreground uppercase font-semibold flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    Chofer
                                                </p>
                                                <p className="text-sm font-medium mt-1">{selectedChofer.name || selectedChofer.nombre}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{selectedChofer.email}</p>
                                            </div>
                                        )}

                                        {/* Total */}
                                        <div className="pt-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-semibold">Total</span>
                                                <Badge className="text-base bg-blue-600 hover:bg-blue-700">
                                                    Bs. {selectedVenta.total}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Estado de completitud */}
                                        <div className="mt-4 pt-4 border-t">
                                            <div className="flex items-start gap-2">
                                                {isFormValid ? (
                                                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                ) : (
                                                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                                )}
                                                <p className="text-xs">
                                                    {isFormValid
                                                        ? 'Formulario completo, listo para crear'
                                                        : 'Completa todos los campos requeridos'}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="border-dashed border-2">
                                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                                        <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-3" />
                                        <p className="text-sm text-muted-foreground">
                                            Selecciona una venta para ver el resumen de la entrega
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex justify-end gap-4 pt-6 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleVolver}
                            className="px-6"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || !isFormValid}
                            className="px-6"
                        >
                            {processing ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creando...
                                </span>
                            ) : (
                                'Crear Entrega'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
