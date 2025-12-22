/**
 * Application Layer Hook: useEnviosCreate
 *
 * Maneja la lógica de negocio para crear envíos
 * Incluye validación, manejo de historial, y navegación
 */

import { router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { Id } from '@/domain/entities/shared';
import type { SelectOption } from '@/presentation/components/ui/search-select';
import type { VentaConDetalles, VehiculoCompleto, ChoferEnvio } from '@/domain/entities/envios';
import { validarFechaProgramada, ChofererHistorialService } from '@/lib/envios.utils';

interface EnviosCreateFormData {
    venta_id: string;
    vehiculo_id: string;
    chofer_id: string;
    fecha_programada: string;
    direccion_entrega: string;
    observaciones: string;
}

interface UseEnviosCreateReturn {
    form: ReturnType<typeof useForm<EnviosCreateFormData>>;
    fechaError: string;
    setFechaError: (error: string) => void;
    historialChoferes: SelectOption[];
    selectedVenta: VentaConDetalles | undefined;
    selectedVehiculo: VehiculoCompleto | undefined;
    selectedChofer: ChoferEnvio | undefined;
    ventasOptions: SelectOption[];
    vehiculosOptions: SelectOption[];
    chofersConHistorial: SelectOption[];
    isFormValid: boolean;
    handleSubmit: (e: React.FormEvent) => void;
    handleVolver: () => void;
}

/**
 * Hook para crear envíos
 * Encapsula validación, transformación de datos y lógica de negocio
 */
export const useEnviosCreate = (
    ventas: VentaConDetalles[],
    vehiculos: VehiculoCompleto[],
    choferes: ChoferEnvio[],
    ventaPreseleccionada?: Id
): UseEnviosCreateReturn => {
    // ✅ Estado del formulario
    const form = useForm<EnviosCreateFormData>({
        venta_id: ventaPreseleccionada ? ventaPreseleccionada.toString() : '',
        vehiculo_id: '',
        chofer_id: '',
        fecha_programada: '',
        direccion_entrega: '',
        observaciones: '',
    });

    // ✅ Estados locales
    const [fechaError, setFechaError] = useState('');
    const [historialChoferes, setHistorialChoferes] = useState<SelectOption[]>([]);

    // ✅ Cargar historial de choferes al montar
    const cargarHistorial = () => {
        const chofersIds = ChofererHistorialService.obtenerHistorial();
        const opciones = chofersIds
            .map(id => choferes.find(c => c.id === id))
            .filter((c): c is ChoferEnvio => !!c)
            .map(chofer => ({
                value: chofer.id,
                label: `${chofer.name} (recientemente usado)`,
                description: chofer.email || '',
            }));
        setHistorialChoferes(opciones);
    };

    // Usar un efecto similar al original
    const { data, setData, post, processing, errors } = form;

    // ✅ Encontrar entidades seleccionadas
    const selectedVenta = ventas.find(v => v.id.toString() === data.venta_id);
    const selectedVehiculo = vehiculos.find(v => v.id.toString() === data.vehiculo_id);
    const selectedChofer = choferes.find(c => c.id.toString() === data.chofer_id);

    // ✅ Convertir datos a opciones para SearchSelect
    const ventasOptions: SelectOption[] = ventas.map(venta => ({
        value: venta.id,
        label: `${venta.numero_venta} - ${venta.cliente.nombre}`,
        description: `Bs. ${venta.total}`,
    }));

    const vehiculosOptions: SelectOption[] = vehiculos.map(vehiculo => ({
        value: vehiculo.id,
        label: `${vehiculo.placa}`,
        description: `${vehiculo.marca} ${vehiculo.modelo} - ${vehiculo.capacidad_carga}kg`,
    }));

    const chofersOptions: SelectOption[] = choferes.map(chofer => ({
        value: chofer.id,
        label: chofer.name,
        description: chofer.email || '',
    }));

    // ✅ Combinar opciones de choferes con historial
    const chofersConHistorial: SelectOption[] = [
        ...historialChoferes,
        ...chofersOptions.filter(
            c => !historialChoferes.some(h => h.value === c.value)
        ),
    ];

    // ✅ Validar si todos los campos requeridos están completos
    const isFormValid = data.venta_id && data.vehiculo_id && data.chofer_id &&
                        data.fecha_programada && data.direccion_entrega;

    /**
     * Manejador de envío del formulario
     */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validar fecha
        const validacion = validarFechaProgramada(data.fecha_programada);
        if (!validacion.valida) {
            setFechaError(validacion.mensaje);
            return;
        }

        setFechaError('');

        // Guardar chofer en historial
        if (data.chofer_id) {
            const choferIdNum = parseInt(data.chofer_id);
            ChofererHistorialService.guardarChofer(choferIdNum);
        }

        // Enviar formulario
        post('/envios');
    };

    /**
     * Volver a la página anterior
     */
    const handleVolver = () => {
        window.history.back();
    };

    // Cargar historial cuando el componente monta
    if (historialChoferes.length === 0 && choferes.length > 0) {
        cargarHistorial();
    }

    return {
        form,
        fechaError,
        setFechaError,
        historialChoferes,
        selectedVenta,
        selectedVehiculo,
        selectedChofer,
        ventasOptions,
        vehiculosOptions,
        chofersConHistorial,
        isFormValid,
        handleSubmit,
        handleVolver,
    };
};
