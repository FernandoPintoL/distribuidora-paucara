import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import AppLayout from '@/layouts/app-layout';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/utils';
import { NotificationService } from '@/services/notification.service';
import SearchSelect, { SelectOption } from '@/components/ui/search-select';

// Importar tipos del domain
import type {
  Proveedor,
  Moneda,
  EstadoDocumento,
  Producto,
  Compra,
  TipoPago
} from '@/domain/compras';

// Form types locales (específicos del formulario)
interface DetalleForm {
  id?: number | string;
  producto_id: number | string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
  lote: string;
  fecha_vencimiento: string;
}

interface CompraFormData {
  numero?: string; // Opcional, se genera automáticamente
  fecha: string;
  numero_factura: string;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  observaciones: string;
  proveedor_id: number | string;
  usuario_id: number | string;
  estado_documento_id: number | string;
  moneda_id: number | string;
  tipo_pago_id: number | string;
  detalles: DetalleForm[];
}

interface PageProps extends InertiaPageProps {
  compra?: Compra;
  proveedores: Proveedor[];
  monedas: Moneda[];
  estados: EstadoDocumento[];
  productos: Producto[];
  tipos_pago: TipoPago[];
}

export default function CompraForm() {
  const { props } = usePage<PageProps>();
  const { user, can } = useAuth();

  // Función para obtener colores según estado
  const getEstadoColor = (estado: EstadoDocumento) => {
    switch (estado.nombre.toUpperCase()) {
      case 'BORRADOR':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'APROBADO':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'RECIBIDO':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case 'PAGADO':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'RECHAZADO':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'ANULADO':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Debug temporal - verificar qué props están llegando
  console.log('Props recibidas:', {
    proveedores: props.proveedores?.length || 0,
    productos: props.productos?.length || 0,
    monedas: props.monedas?.length || 0,
    estados: props.estados?.length || 0,
    tipos_pago: props.tipos_pago?.length || 0,
    tipos_pago_data: props.tipos_pago,
  });

  const isEditing = Boolean(props.compra);
  const title = isEditing ? 'Editar Compra' : 'Nueva Compra';

  // Estados según el flujo documentado
  const estadoActual = props.compra?.estadoDocumento?.nombre;
  const puedeEditarBasico = !estadoActual || ['BORRADOR', 'RECHAZADO'].includes(estadoActual);
  const puedeEditarSupervisor = ['PENDIENTE'].includes(estadoActual || '');
  const soloLectura = ['PAGADO', 'ANULADO'].includes(estadoActual || '');

  const { data, setData, post, put, processing, errors } = useForm<CompraFormData>({
    numero: props.compra?.numero || undefined, // Solo para edición
    fecha: props.compra?.fecha ?? new Date().toISOString().slice(0, 10),
    numero_factura: props.compra?.numero_factura ?? '',
    subtotal: props.compra?.subtotal ?? 0,
    descuento: props.compra?.descuento ?? 0,
    impuesto: props.compra?.impuesto ?? 0,
    total: props.compra?.total ?? 0,
    observaciones: props.compra?.observaciones ?? '',
    proveedor_id: props.compra?.proveedor_id ?? '',
    usuario_id: props.compra?.usuario_id ?? user?.id ?? '',
    estado_documento_id: props.compra?.estado_documento_id ??
      props.estados?.find(e => e.nombre === 'Borrador')?.id ??
      props.estados?.[0]?.id ?? '',
    moneda_id: props.compra?.moneda_id ?? 1, // Por defecto moneda ID=1
    tipo_pago_id: props.compra?.tipo_pago_id ??
      props.tipos_pago?.find(t => t.codigo === 'EFECTIVO')?.id ??
      props.tipos_pago?.[0]?.id ?? '',
    detalles: props.compra?.detalles?.map(d => ({
      id: d.id,
      producto_id: d.producto?.id ?? '',
      cantidad: d.cantidad,
      precio_unitario: d.precio_unitario,
      descuento: 0,
      subtotal: d.subtotal,
      lote: d.lote ?? '',
      fecha_vencimiento: d.fecha_vencimiento ?? '',
    })) ?? [
        { producto_id: '', cantidad: 1, precio_unitario: 0, descuento: 0, subtotal: 0, lote: '', fecha_vencimiento: '' },
      ],
  });

  const canCreate = can('compras.create');
  const canUpdate = can('compras.update');

  // Estados para autoguardado
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedData, setLastSavedData] = useState<string>('');
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Función para validar si la compra tiene contenido mínimo para autoguardar
  const hasMinimumContent = useCallback(() => {
    return (
      data.proveedor_id !== '' &&
      data.detalles.some(d => d.producto_id !== '' && d.cantidad > 0 && d.precio_unitario > 0)
    );
  }, [data.proveedor_id, data.detalles]);

  // Función de autoguardado
  const autoSave = useCallback(async () => {
    if (!hasMinimumContent() || !hasUnsavedChanges) {
      return;
    }

    try {
      const estadoPendienteId = props.estados?.find(e => e.nombre === 'Pendiente')?.id;
      const dataToSave = {
        ...data,
        // Si es nuevo y tiene contenido, cambiar a PENDIENTE automáticamente
        estado_documento_id: !isEditing && estadoPendienteId ? estadoPendienteId : data.estado_documento_id,
        // Filtrar detalles válidos
        detalles: data.detalles.filter(d => d.producto_id !== '')
      };

      const response = await fetch(isEditing ? `/compras/${props.compra?.id}` : '/compras', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...dataToSave,
          _autoguardado: true, // Flag para indicar que es autoguardado
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Si era una nueva compra, mostrar notificación específica
        if (!isEditing && result.compra?.id) {
          NotificationService.info(`📄 Compra #${result.compra.numero} guardada automáticamente como pendiente`);
        } else {
          NotificationService.info('💾 Cambios guardados automáticamente');
        }

        setHasUnsavedChanges(false);
        setLastSavedData(JSON.stringify(dataToSave));
      }
    } catch (error) {
      console.error('Error en autoguardado:', error);
      // No mostrar error al usuario para no interrumpir su trabajo
    }
  }, [data, hasMinimumContent, hasUnsavedChanges, isEditing, props.compra?.id, props.estados]);

  // Detectar cambios en el formulario
  useEffect(() => {
    const currentData = JSON.stringify(data);
    if (currentData !== lastSavedData && lastSavedData !== '') {
      setHasUnsavedChanges(true);
    }
  }, [data, lastSavedData]);

  // Configurar autoguardado cada 30 segundos
  useEffect(() => {
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }

    autoSaveIntervalRef.current = setInterval(() => {
      autoSave();
    }, 30000); // 30 segundos

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [autoSave]);

  // Guardar antes de cerrar ventana/pestaña
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && hasMinimumContent()) {
        // Intentar guardar síncronamente
        autoSave();

        // Mostrar confirmación al usuario
        event.preventDefault();
        event.returnValue = 'Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, hasMinimumContent, autoSave]);

  // Guardar cuando se pierde el foco de la ventana
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasUnsavedChanges && hasMinimumContent()) {
        autoSave();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasUnsavedChanges, hasMinimumContent, autoSave]);

  // Convertir proveedores a opciones para SearchSelect
  const proveedorOptions: SelectOption[] = props.proveedores?.map(proveedor => ({
    value: proveedor.id,
    label: proveedor.nombre,
    description: proveedor.email ? `Email: ${proveedor.email}` : undefined,
  })) ?? [];

  // Convertir productos a opciones para SearchSelect
  const productoOptions: SelectOption[] = props.productos?.map(producto => ({
    value: producto.id,
    label: producto.nombre,
    description: `Código: ${producto.codigo} - Stock: ${producto.stock || 0}`,
  })) ?? [];

  // Convertir tipos de pago a opciones para SearchSelect
  const tipoPagoOptions: SelectOption[] = props.tipos_pago?.map(tipo => ({
    value: tipo.id,
    label: tipo.nombre,
    description: `Código: ${tipo.codigo}`,
  })) ?? [];

  // Convertir estados a opciones para SearchSelect
  const getEstadosPermitidos = () => {
    if (!isEditing) {
      // Para nuevas compras, solo BORRADOR es permitido inicialmente
      return props.estados?.filter(estado => estado.nombre === 'Borrador') ?? [];
    }

    const estadoActual = props.compra?.estadoDocumento?.nombre;

    // Filtrar estados según el flujo de negocio
    switch (estadoActual) {
      case 'Borrador':
        return props.estados?.filter(estado =>
          ['Borrador', 'Pendiente'].includes(estado.nombre)
        ) ?? [];
      case 'Pendiente':
        return props.estados?.filter(estado =>
          ['Pendiente', 'Aprobado', 'Rechazado'].includes(estado.nombre)
        ) ?? [];
      case 'Aprobado':
        return props.estados?.filter(estado =>
          ['Aprobado', 'Recibido', 'Anulado'].includes(estado.nombre)
        ) ?? [];
      case 'Recibido':
        return props.estados?.filter(estado =>
          ['Recibido', 'Pagado', 'Anulado'].includes(estado.nombre)
        ) ?? [];
      case 'Rechazado':
        return props.estados?.filter(estado =>
          ['Rechazado', 'Pendiente'].includes(estado.nombre)
        ) ?? [];
      default:
        // Estados finales (Pagado, Anulado) no permiten cambios
        return props.estados?.filter(estado => estado.nombre === estadoActual) ?? [];
    }
  };

  const estadoOptions: SelectOption[] = getEstadosPermitidos().map(estado => ({
    value: estado.id,
    label: estado.nombre,
  }));

  // Mostrar mensajes flash del backend
  useEffect(() => {
    const flash = (props as InertiaPageProps & { flash?: { success?: string, error?: string } })?.flash;
    if (flash?.success) {
      NotificationService.success(flash.success);
    }
    if (flash?.error) {
      NotificationService.error(flash.error);
    }
  }, [props]);

  // Recalcular totales cuando cambian detalles
  useEffect(() => {
    const subtotal = data.detalles.reduce((acc, d: DetalleForm) => {
      const cantidad = Number(d.cantidad) || 0;
      const precio = Number(d.precio_unitario) || 0;
      const descuento = Number(d.descuento) || 0;
      return acc + (cantidad * precio) - descuento;
    }, 0);

    const impuesto = Number(data.impuesto) || 0;
    const total = subtotal + impuesto - Number(data.descuento);

    setData(prev => ({ ...prev, subtotal, total }));
  }, [data.detalles, data.impuesto, data.descuento, setData]);

  const addRow = () => {
    setData('detalles', [...data.detalles, {
      producto_id: '',
      cantidad: 1,
      precio_unitario: 0,
      descuento: 0,
      subtotal: 0,
      lote: '',
      fecha_vencimiento: ''
    }]);
  };

  const removeRow = (idx: number) => {
    if (data.detalles.length <= 1) {
      NotificationService.error('Debe mantener al menos un detalle');
      return;
    }
    setData('detalles', data.detalles.filter((_: DetalleForm, i: number) => i !== idx));
  };

  const updateDetalle = (idx: number, field: keyof DetalleForm, value: string | number) => {
    const newDetalles = [...data.detalles];
    newDetalles[idx] = { ...newDetalles[idx], [field]: value };

    // Recalcular subtotal para este detalle
    if (field === 'cantidad' || field === 'precio_unitario' || field === 'descuento') {
      const cantidad = field === 'cantidad' ? Number(value) : Number(newDetalles[idx].cantidad);
      const precio = field === 'precio_unitario' ? Number(value) : Number(newDetalles[idx].precio_unitario);
      const descuento = field === 'descuento' ? Number(value) : Number(newDetalles[idx].descuento);
      newDetalles[idx].subtotal = (cantidad * precio) - descuento;
    }

    setData('detalles', newDetalles);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canCreate && !isEditing) {
      NotificationService.error('No tiene permisos para crear compras');
      return;
    }

    if (!canUpdate && isEditing) {
      NotificationService.error('No tiene permisos para editar compras');
      return;
    }

    const submitData = {
      ...data,
      detalles: data.detalles.filter(d => d.producto_id !== '')
    };

    if (submitData.detalles.length === 0) {
      NotificationService.error('Debe agregar al menos un producto');
      return;
    }

    // Mostrar modal de loading
    let loadingToast: string;

    const options = {
      onStart: () => {
        loadingToast = NotificationService.loading(
          isEditing
            ? 'Actualizando compra...'
            : 'Guardando compra...'
        );
      },
      onSuccess: () => {
        if (loadingToast) {
          NotificationService.dismiss(loadingToast);
        }

        // El mensaje del backend se manejará via session flash
        NotificationService.success(
          isEditing ? 'Compra actualizada exitosamente' : 'Compra creada exitosamente'
        );
      },
      onError: (errors: Record<string, string>) => {
        if (loadingToast) {
          NotificationService.dismiss(loadingToast);
        }

        // Mostrar errores específicos del backend
        if (errors.error) {
          NotificationService.error(errors.error);
        } else {
          NotificationService.error(
            isEditing ? 'Error al actualizar la compra' : 'Error al crear la compra'
          );
        }
        console.error('Form errors:', errors);
      },
      onFinish: () => {
        if (loadingToast) {
          NotificationService.dismiss(loadingToast);
        }
      },
    };

    if (isEditing && props.compra) {
      put(`/compras/${props.compra.id}`, options);
    } else {
      post('/compras', options);
    }
  };

  const selectedMoneda = props.monedas.find(m => m.id === Number(data.moneda_id));

  return (
    <AppLayout breadcrumbs={[
      { title: 'Compras', href: '/compras' },
      { title, href: '#' }
    ]}>
      <Head title={title} />

      <form onSubmit={submit} className="space-y-6 p-6">
        {/* Campo hidden para moneda_id */}
        <input type="hidden" name="moneda_id" value={data.moneda_id} />

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
          <div className="flex gap-3">
            <Link
              href="/compras"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={(!canCreate && !isEditing) || (!canUpdate && isEditing) || processing}
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </div>

        {((!canCreate && !isEditing) || (!canUpdate && isEditing)) && (
          <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-100">
            <AlertTitle>Permiso requerido</AlertTitle>
            <AlertDescription>
              No tiene permiso para {isEditing ? 'editar' : 'crear'} compras. Puede revisar la información pero no podrá guardar cambios.
            </AlertDescription>
          </Alert>
        )}

        {/* Indicador de estado actual para compras existentes */}
        {isEditing && props.compra?.estadoDocumento && (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Estado: {props.compra.estadoDocumento.nombre}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {estadoActual === 'BORRADOR' && 'Compra en desarrollo. Puede editar todos los campos.'}
                  {estadoActual === 'PENDIENTE' && 'Esperando aprobación. Solo supervisores pueden editar.'}
                  {estadoActual === 'APROBADO' && 'Compra aprobada. Esperando recepción de mercancía.'}
                  {estadoActual === 'RECIBIDO' && 'Mercancía recibida. Puede proceder al pago.'}
                  {estadoActual === 'PAGADO' && 'Compra completada. Solo lectura.'}
                  {estadoActual === 'ANULADO' && 'Compra anulada. Solo lectura.'}
                  {estadoActual === 'RECHAZADO' && 'Compra rechazada. Puede editar y reenviar.'}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(props.compra.estadoDocumento)}`}>
                {props.compra.estadoDocumento.nombre}
              </div>
            </div>
          </div>
        )}

        {/* Información general */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Información General</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Campo de número solo se muestra en modo edición */}
            {isEditing && (
              <div>
                <label htmlFor="numero" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número *
                </label>
                <input
                  id="numero"
                  type="text"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  value={data.numero || ''}
                  onChange={e => setData('numero', e.target.value)}
                  placeholder="Ej: COMP-001"
                />
                {errors.numero && <p className="text-red-600 text-xs mt-1">{errors.numero}</p>}
              </div>
            )}

            <div>
              <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha *
              </label>
              <input
                id="fecha"
                type="date"
                disabled={soloLectura}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-800 dark:disabled:text-gray-400"
                value={data.fecha}
                onChange={e => setData('fecha', e.target.value)}
              />
              {errors.fecha && <p className="text-red-600 text-xs mt-1">{errors.fecha}</p>}
            </div>

            <div>
              <SearchSelect
                id="proveedor_id"
                label="Proveedor"
                required
                disabled={soloLectura || (puedeEditarSupervisor && !puedeEditarBasico)}
                value={data.proveedor_id}
                options={proveedorOptions}
                onChange={(value) => setData('proveedor_id', value || '')}
                placeholder="Seleccionar proveedor"
                emptyText="No se encontraron proveedores"
                searchPlaceholder="Buscar proveedor..."
                error={errors.proveedor_id}
              />
            </div>

            <div>
              <SearchSelect
                id="tipo_pago_id"
                label="Tipo de Pago"
                disabled={soloLectura}
                value={data.tipo_pago_id}
                options={tipoPagoOptions}
                onChange={(value) => setData('tipo_pago_id', value || '')}
                placeholder="Seleccionar tipo de pago"
                emptyText="No se encontraron tipos de pago"
                searchPlaceholder="Buscar tipo de pago..."
                error={errors.tipo_pago_id}
              />
            </div>

            <div>
              <SearchSelect
                id="estado_documento_id"
                label="Estado"
                required
                disabled={soloLectura}
                value={data.estado_documento_id}
                options={estadoOptions}
                onChange={(value) => setData('estado_documento_id', value || '')}
                placeholder="Seleccionar estado"
                emptyText="No se encontraron estados"
                searchPlaceholder="Buscar estado..."
                error={errors.estado_documento_id}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="numero_factura" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número de Recibo/Factura
              </label>
              <input
                id="numero_factura"
                type="text"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                value={data.numero_factura}
                onChange={e => setData('numero_factura', e.target.value)}
                placeholder="Número de recibo/factura del proveedor"
              />
              {errors.numero_factura && <p className="text-red-600 text-xs mt-1">{errors.numero_factura}</p>}
            </div>

            <div>
              <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Observaciones
              </label>
              <input
                id="observaciones"
                type="text"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                value={data.observaciones}
                onChange={e => setData('observaciones', e.target.value)}
                placeholder="Observaciones adicionales"
              />
              {errors.observaciones && <p className="text-red-600 text-xs mt-1">{errors.observaciones}</p>}
            </div>
          </div>
        </div>

        {/* Detalles de productos */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Productos</h3>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Agregar Producto
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Producto *
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cantidad *
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Precio Unit. *
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Subtotal
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.detalles.map((detalle: DetalleForm, idx: number) => (
                  <tr key={idx}>
                    <td className="px-4 py-3">
                      <SearchSelect
                        value={detalle.producto_id}
                        options={productoOptions}
                        onChange={(value) => updateDetalle(idx, 'producto_id', value || '')}
                        placeholder="Seleccionar producto"
                        emptyText="No se encontraron productos"
                        searchPlaceholder="Buscar producto..."
                        error={errors[`detalles.${idx}.producto_id`]}
                        className="min-w-[200px]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-right focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={detalle.cantidad}
                        onChange={e => updateDetalle(idx, 'cantidad', Number(e.target.value))}
                      />
                      {errors[`detalles.${idx}.cantidad`] && (
                        <p className="text-red-600 text-xs mt-1">{errors[`detalles.${idx}.cantidad`]}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-right focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        value={detalle.precio_unitario}
                        onChange={e => updateDetalle(idx, 'precio_unitario', Number(e.target.value))}
                      />
                      {errors[`detalles.${idx}.precio_unitario`] && (
                        <p className="text-red-600 text-xs mt-1">{errors[`detalles.${idx}.precio_unitario`]}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {formatCurrency(detalle.subtotal, selectedMoneda?.simbolo)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        disabled={data.detalles.length <= 1}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumen financiero */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Resumen</h3>

          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="font-mono">{formatCurrency(data.subtotal, selectedMoneda?.simbolo)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Descuento:</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-20 px-2 py-1 text-right text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={data.descuento}
                    onChange={e => setData('descuento', Number(e.target.value))}
                  />
                  <span className="font-mono">{formatCurrency(data.descuento, selectedMoneda?.simbolo)}</span>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Impuestos:</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-20 px-2 py-1 text-right text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={data.impuesto}
                    onChange={e => setData('impuesto', Number(e.target.value))}
                  />
                  <span className="font-mono">{formatCurrency(data.impuesto, selectedMoneda?.simbolo)}</span>
                </div>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span className="font-mono text-lg">{formatCurrency(data.total, selectedMoneda?.simbolo)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </AppLayout>
  );
}
