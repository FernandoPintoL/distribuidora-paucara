import { useState } from 'react';
import { Card } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { AlertCircle, Package } from 'lucide-react';
import type { VentaConDetalles, VehiculoCompleto, ChoferEntrega } from '@/domain/entities/entregas';

interface SimpleEntregaFormProps {
    venta: VentaConDetalles;
    vehiculos: VehiculoCompleto[];
    choferes: ChoferEntrega[];
    onSubmit: (data: EntregaFormData) => Promise<void>;
    isLoading?: boolean;
}

interface EntregaFormData {
    venta_id: number;
    vehiculo_id: number | null;
    chofer_id: number | null;
    fecha_programada: string;
    direccion_entrega?: string;
    observaciones?: string;
}

export default function SimpleEntregaForm({
    venta,
    vehiculos,
    choferes,
    onSubmit,
    isLoading = false,
}: SimpleEntregaFormProps) {
    const [formData, setFormData] = useState<EntregaFormData>({
        venta_id: venta.id,
        vehiculo_id: null,
        chofer_id: null,
        fecha_programada: '',
        direccion_entrega: '',
        observaciones: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const selectedVehiculo = vehiculos.find((v) => v.id === formData.vehiculo_id);
    const pesoEstimado = venta.peso_estimado ?? 0;
    const capacidadInsuficiente =
        selectedVehiculo && pesoEstimado > selectedVehiculo.capacidad_kg;

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.vehiculo_id) {
            newErrors.vehiculo_id = 'Selecciona un vehículo';
        }
        if (!formData.chofer_id) {
            newErrors.chofer_id = 'Selecciona un chofer';
        }
        if (!formData.fecha_programada) {
            newErrors.fecha_programada = 'Selecciona una fecha';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0 && !capacidadInsuficiente;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            return;
        }

        try {
            await onSubmit(formData);
        } catch (error) {
            console.error('Error al crear entrega:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Resumen de Venta */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 p-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="font-semibold text-blue-900 dark:text-blue-200">
                            Venta: {venta.numero_venta}
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-300 ml-7">
                        <div>
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                                Cliente
                            </p>
                            <p className="font-semibold">{venta.cliente.nombre}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                                Monto Total
                            </p>
                            <p className="font-semibold">Bs {venta.total.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                                Items
                            </p>
                            <p className="font-semibold">{venta.cantidad_items ?? 0} productos</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
                                Peso Estimado
                            </p>
                            <p className="font-semibold">{pesoEstimado.toFixed(1)} kg</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Formulario */}
            <form onSubmit={handleSubmit}>
                <Card className="dark:bg-slate-900 dark:border-slate-700 p-6 space-y-6">
                    {/* Vehículo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Vehículo *
                        </label>
                        <select
                            value={formData.vehiculo_id ?? ''}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    vehiculo_id: e.target.value ? parseInt(e.target.value) : null,
                                })
                            }
                            className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white ${
                                errors.vehiculo_id ? 'border-red-500' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Selecciona un vehículo</option>
                            {vehiculos.map((v) => (
                                <option key={v.id} value={v.id}>
                                    {v.placa} - {v.marca} {v.modelo} ({v.capacidad_kg} kg)
                                </option>
                            ))}
                        </select>
                        {errors.vehiculo_id && (
                            <p className="text-red-500 text-sm mt-1">{errors.vehiculo_id}</p>
                        )}
                    </div>

                    {/* Advertencia de capacidad */}
                    {capacidadInsuficiente && (
                        <div className="flex gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                            <div className="text-sm text-red-800 dark:text-red-300">
                                <p className="font-semibold">Capacidad insuficiente</p>
                                <p className="text-xs">
                                    El peso ({pesoEstimado.toFixed(1)} kg) excede la capacidad
                                    ({selectedVehiculo?.capacidad_kg} kg)
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Chofer */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Chofer *
                        </label>
                        <select
                            value={formData.chofer_id ?? ''}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    chofer_id: e.target.value ? parseInt(e.target.value) : null,
                                })
                            }
                            className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white ${
                                errors.chofer_id ? 'border-red-500' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Selecciona un chofer</option>
                            {choferes.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.nombre || c.name}
                                </option>
                            ))}
                        </select>
                        {errors.chofer_id && (
                            <p className="text-red-500 text-sm mt-1">{errors.chofer_id}</p>
                        )}
                    </div>

                    {/* Fecha Programada */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Fecha Programada *
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.fecha_programada}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    fecha_programada: e.target.value,
                                })
                            }
                            className={`w-full px-3 py-2 border rounded-lg dark:bg-slate-800 dark:border-slate-600 dark:text-white ${
                                errors.fecha_programada ? 'border-red-500' : 'border-gray-300'
                            }`}
                        />
                        {errors.fecha_programada && (
                            <p className="text-red-500 text-sm mt-1">{errors.fecha_programada}</p>
                        )}
                    </div>

                    {/* Dirección */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Dirección de Entrega
                        </label>
                        <input
                            type="text"
                            value={formData.direccion_entrega}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    direccion_entrega: e.target.value,
                                })
                            }
                            placeholder="Calle, número, zona"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                        />
                    </div>

                    {/* Observaciones */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Observaciones (opcional)
                        </label>
                        <textarea
                            value={formData.observaciones}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    observaciones: e.target.value,
                                })
                            }
                            rows={3}
                            placeholder="Notas adicionales para la entrega"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                        />
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3 justify-end pt-4 border-t dark:border-slate-700">
                        <Button
                            type="submit"
                            disabled={
                                isLoading ||
                                !formData.vehiculo_id ||
                                !formData.chofer_id ||
                                !formData.fecha_programada ||
                                capacidadInsuficiente
                            }
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 dark:bg-green-700 dark:hover:bg-green-600"
                        >
                            {isLoading ? 'Creando...' : 'Crear Entrega'}
                        </Button>
                    </div>
                </Card>
            </form>
        </div>
    );
}
