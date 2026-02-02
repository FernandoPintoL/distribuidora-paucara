import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import AppLayout from '@/layouts/app-layout';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/application/hooks/use-auth';
import { Alert, AlertTitle, AlertDescription } from '@/presentation/components/ui/alert';
import { formatCurrency } from '@/lib/utils';
import { NotificationService } from '@/infrastructure/services/notification.service';
import SearchSelect, { SelectOption } from '@/presentation/components/ui/search-select';
import InputSearch from '@/presentation/components/ui/input-search';
import ModalCrearProveedor from '@/presentation/components/ui/modal-crear-proveedor';
import ProductosTable from '@/presentation/components/ProductosTable';
import { useProveedorSearch } from '@/infrastructure/hooks/use-api-search';

// Importar tipos del domain
import type { Compra } from '@/domain/entities/compras';
import type { Proveedor } from '@/domain/entities/proveedores';
import type { Moneda } from '@/domain/entities/monedas';
import type { EstadoDocumento } from '@/domain/entities/estados-documento';
import type { Producto } from '@/domain/entities/productos';
import type { TipoPago } from '@/domain/entities/tipos-pago';

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
  precio_costo?: number; // ✅ NUEVO: Precio de costo registrado
  producto?: any; // ✅ NUEVO: Información completa del producto
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
  almacen_id: number | string;
  detalles: DetalleForm[];
}

interface Almacen {
  id: number;
  nombre: string;
  activo: boolean;
}

interface PageProps extends InertiaPageProps {
  compra?: Compra;
  proveedores: Proveedor[];
  monedas: Moneda[];
  estados: EstadoDocumento[];
  productos: Producto[];
  tipos_pago: TipoPago[];
  almacenes: Almacen[];
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
      case 'FACTURADO':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case 'CANCELADO':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
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
  const title = isEditing ? `Editar Compra: ${props.compra?.numero}` : 'Nueva Compra';

  // Hooks para búsqueda con autocompletado
  const proveedorSearch = useProveedorSearch();

  // Estados según el flujo documentado
  const estadoActual = props.compra?.estadoDocumento?.nombre;
  console.log('🔍 Estado actual:', {
    isEditing,
    estadoActual,
    estadoDocumento: props.compra?.estadoDocumento,
    estadoDocumentoId: props.compra?.estado_documento_id,
  });
  // BORRADOR: Editable todo | APROBADO: Solo observaciones | FACTURADO+: Solo lectura
  const editableBorrador = !estadoActual || estadoActual === 'BORRADOR'; // Crear o editar en BORRADOR
  const editableAprobado = estadoActual === 'APROBADO'; // En APROBADO solo observaciones
  const soloLectura = ['FACTURADO', 'CANCELADO', 'ANULADO'].includes(estadoActual || '');

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
    almacen_id: props.compra?.almacen_id ??
      props.almacenes?.find(a => a.activo)?.id ??
      props.almacenes?.[0]?.id ?? '',
    detalles: props.compra?.detalles?.map(d => ({
      id: d.id,
      producto_id: d.producto?.id ?? '',
      cantidad: d.cantidad,
      precio_unitario: d.precio_unitario,
      descuento: 0,
      subtotal: d.subtotal,
      lote: d.lote ?? '',
      fecha_vencimiento: d.fecha_vencimiento ?? '',
    })) ?? [],
  });

  const canCreate = can('compras.create');
  const canUpdate = can('compras.update');

  // Estados para autoguardado
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedData, setLastSavedData] = useState<string>('');
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Estado para manejar el valor y display del InputSearch de proveedor
  const [proveedorValue, setProveedorValue] = useState<string | number | null>(data.proveedor_id);
  const [proveedorDisplay, setProveedorDisplay] = useState<string>('');

  // Estado para el modal de crear proveedor
  const [showCreateProveedorModal, setShowCreateProveedorModal] = useState(false);
  const [proveedorSearchQuery, setProveedorSearchQuery] = useState('');

  // Sincronizar el estado del InputSearch con los datos del formulario
  useEffect(() => {
    if (data.proveedor_id !== proveedorValue) {
      setProveedorValue(data.proveedor_id);
    }
  }, [data.proveedor_id]); // ✅ Solo depende de data.proveedor_id, no de proveedorValue

  // Cargar el nombre del proveedor cuando se edita una compra
  useEffect(() => {
    if (isEditing && data.proveedor_id) {
      const proveedor = props.proveedores?.find(p => p.id === Number(data.proveedor_id));
      if (proveedor) {
        setProveedorDisplay(proveedor.nombre);
        console.log('✅ Proveedor cargado:', proveedor.nombre);
      }
    }
  }, [isEditing, data.proveedor_id, props.proveedores]);

  // Función para manejar la creación de proveedor
  const handleCreateProveedor = (searchQuery: string) => {
    setProveedorSearchQuery(searchQuery);
    setShowCreateProveedorModal(true);
  };

  // Función para manejar cuando se crea un proveedor exitosamente
  const handleProveedorCreated = (proveedor: Proveedor) => {
    // Actualizar el valor del proveedor en el formulario
    setData('proveedor_id', proveedor.id);

    // Actualizar el estado del InputSearch
    setProveedorValue(proveedor.id);
    setProveedorDisplay(proveedor.nombre);

    // Crear una descripción completa del proveedor para mostrar en la notificación
    const descripcionProveedor = [
      proveedor.nombre,
      proveedor.razon_social && proveedor.razon_social !== proveedor.nombre ? `(${proveedor.razon_social})` : '',
      proveedor.nit ? `NIT: ${proveedor.nit}` : '',
      proveedor.telefono ? `Tel: ${proveedor.telefono}` : '',
      proveedor.email ? `Email: ${proveedor.email}` : ''
    ].filter(Boolean).join(' • ');

    // Mostrar notificación detallada del proveedor creado y seleccionado
    try {
      NotificationService.success(
        `✅ Proveedor creado y seleccionado: ${descripcionProveedor}`
      );
    } catch (error) {
      console.error('Error en NotificationService:', error);
      // Fallback: mostrar mensaje básico
      console.log(`✅ Proveedor creado y seleccionado: ${descripcionProveedor}`);
    }

    // Limpiar la query de búsqueda ya que ahora tenemos el proveedor seleccionado
    setProveedorSearchQuery('');
  };

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

      // Preparar datos con tipos correctos para autoguardado
      const dataToSave = {
        numero: data.numero || undefined,
        fecha: data.fecha,
        numero_factura: data.numero_factura || '',
        subtotal: parseFloat(String(data.subtotal)),
        descuento: parseFloat(String(data.descuento || 0)),
        impuesto: parseFloat(String(data.impuesto || 0)),
        total: parseFloat(String(data.total)),
        observaciones: data.observaciones || '',
        proveedor_id: parseInt(String(data.proveedor_id)),
        usuario_id: parseInt(String(data.usuario_id)),
        estado_documento_id: !isEditing && estadoPendienteId
          ? parseInt(String(estadoPendienteId))
          : parseInt(String(data.estado_documento_id)),
        moneda_id: parseInt(String(data.moneda_id)),
        tipo_pago_id: data.tipo_pago_id ? parseInt(String(data.tipo_pago_id)) : null,
        almacen_id: data.almacen_id ? parseInt(String(data.almacen_id)) : null,
        // Filtrar detalles válidos y convertir tipos
        detalles: data.detalles
          .filter(d => d.producto_id !== '')
          .map(detalle => ({
            id: detalle.id || undefined,
            producto_id: parseInt(String(detalle.producto_id)),
            cantidad: parseInt(String(detalle.cantidad)),
            precio_unitario: parseFloat(String(detalle.precio_unitario)),
            descuento: parseFloat(String(detalle.descuento || 0)),
            subtotal: parseFloat(String(detalle.subtotal)),
            lote: detalle.lote || '',
            fecha_vencimiento: detalle.fecha_vencimiento || null,
          })),
        _autoguardado: true, // Flag para indicar que es autoguardado
      };

      const response = await fetch(isEditing ? `/compras/${props.compra?.id}` : '/compras', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Accept': 'application/json',
        },
        body: JSON.stringify(dataToSave),
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

  // ✅ NUEVO: Guardar automáticamente en localStorage con debounce
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isEditing) return; // No guardar si estamos editando una compra existente

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      try {
        const datosAGuardar = {
          data,
          proveedorValue,
          proveedorDisplay,
        };
        localStorage.setItem('compra-create-draft', JSON.stringify(datosAGuardar));
        console.log('✅ Compra guardada en localStorage');
      } catch (error) {
        console.error('❌ Error guardando compra en localStorage:', error);
      }
    }, 1000); // Debounce de 1 segundo

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [data, proveedorValue, proveedorDisplay, isEditing]);

  // ✅ NUEVO: Restaurar datos del localStorage al cargar
  useEffect(() => {
    if (isEditing) return; // No restaurar si estamos editando una compra existente

    const datosGuardados = localStorage.getItem('compra-create-draft');
    if (datosGuardados) {
      try {
        const parsed = JSON.parse(datosGuardados);
        console.log('📋 Restaurando compra desde localStorage:', parsed);

        // Restaurar datos del formulario
        if (parsed.data) {
          Object.keys(parsed.data).forEach((key: string) => {
            setData(key as any, parsed.data[key]);
          });
        }

        // Restaurar proveedor
        if (parsed.proveedorValue !== null) {
          setProveedorValue(parsed.proveedorValue);
        }
        if (parsed.proveedorDisplay) {
          setProveedorDisplay(parsed.proveedorDisplay);
        }

        NotificationService.success('✅ Compra restaurada desde borrador anterior');
      } catch (error) {
        console.error('❌ Error restaurando compra desde localStorage:', error);
      }
    }
  }, []); // Solo ejecutar al montar el componente

  // ✅ MEMOIZED: Convertir tipos de pago a opciones para SearchSelect
  const tipoPagoOptions: SelectOption[] = useMemo(() =>
    props.tipos_pago?.map(tipo => ({
      value: tipo.id,
      label: tipo.nombre,
      description: `Código: ${tipo.codigo}`,
    })) ?? [],
    [props.tipos_pago]
  );

  // ✅ MEMOIZED: Convertir almacenes a opciones para SearchSelect
  const almacenOptions: SelectOption[] = useMemo(() =>
    props.almacenes?.map(almacen => ({
      value: almacen.id,
      label: almacen.nombre,
      description: almacen.activo ? 'Activo' : 'Inactivo',
    })) ?? [],
    [props.almacenes]
  );

  // ✅ MEMOIZED: Convertir estados a opciones para SearchSelect
  const estadoOptions: SelectOption[] = useMemo(() => {
    const getEstadosPermitidos = () => {
      if (!isEditing) {
        // Para nuevas compras, permitir BORRADOR o APROBADO
        return props.estados?.filter(estado =>
          ['Borrador', 'Aprobado'].includes(estado.nombre)
        ) ?? [];
      }

      const estadoActual = props.compra?.estadoDocumento?.nombre;
      console.log('🔍 getEstadosPermitidos - estadoActual:', estadoActual, 'all estados:', props.estados);

      // Filtrar estados según el flujo de negocio
      switch (estadoActual) {
        case 'Borrador':
          return props.estados?.filter(estado =>
            ['Borrador', 'Aprobado', 'Pendiente'].includes(estado.nombre)
          ) ?? [];
        case 'Pendiente':
          return props.estados?.filter(estado =>
            ['Pendiente', 'Aprobado', 'Anulado'].includes(estado.nombre)
          ) ?? [];
        case 'Aprobado':
          return props.estados?.filter(estado =>
            ['Aprobado', 'Facturado', 'Anulado'].includes(estado.nombre)
          ) ?? [];
        case 'Facturado':
          return props.estados?.filter(estado =>
            ['Facturado', 'Cancelado', 'Anulado'].includes(estado.nombre)
          ) ?? [];
        default:
          // Estados finales (Anulado, Cancelado) no permiten cambios
          console.log('🔍 getEstadosPermitidos - Usando DEFAULT case, estadoActual:', estadoActual);
          const result = props.estados?.filter(estado => estado.nombre === estadoActual) ?? [];
          console.log('🔍 resultado del default:', result);
          return result;
      }
    };

    const opciones = getEstadosPermitidos().map(estado => ({
      value: estado.id,
      label: estado.nombre,
    }));
    console.log('📦 estadoOptions final:', opciones);
    return opciones;
  }, [isEditing, props.compra?.estadoDocumento?.nombre, props.estados]);

  // Mostrar mensajes flash del backend
  useEffect(() => {
    const flash = (props as InertiaPageProps & { flash?: { success?: string, error?: string } })?.flash;
    if (flash?.success) {
      NotificationService.success(flash.success);
    }
    if (flash?.error) {
      NotificationService.error(flash.error);
    }
  }, []); // ✅ Solo ejecutar una vez al montar el componente

  // Recalcular totales cuando cambian detalles
  useEffect(() => {
    const subtotal = data.detalles.reduce((acc, d: DetalleForm) => {
      const cantidad = Number(d.cantidad) || 0;
      const precio = Number(d.precio_unitario) || 0;
      const descuento = Number(d.descuento) || 0;
      return acc + (cantidad * precio) - descuento;
    }, 0);

    const impuesto = Number(data.impuesto) || 0;
    // Por ahora no se suma impuesto al total
    const total = subtotal - Number(data.descuento);

    setData(prev => ({ ...prev, subtotal, total }));
  }, [data.detalles, data.impuesto, data.descuento, setData]);

  const removeRow = (idx: number) => {
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

  // Detectar si los campos del header han cambiado
  const hasHeaderChanges = (): boolean => {
    if (!isEditing || !props.compra) return false;

    return (
      data.numero !== String(props.compra.numero) ||
      data.fecha !== props.compra.fecha ||
      data.numero_factura !== (props.compra.numero_factura || '') ||
      parseFloat(String(data.subtotal)) !== parseFloat(String(props.compra.subtotal)) ||
      parseFloat(String(data.descuento || 0)) !== parseFloat(String(props.compra.descuento || 0)) ||
      parseFloat(String(data.impuesto || 0)) !== parseFloat(String(props.compra.impuesto || 0)) ||
      parseFloat(String(data.total)) !== parseFloat(String(props.compra.total)) ||
      data.observaciones !== (props.compra.observaciones || '') ||
      parseInt(String(data.proveedor_id)) !== props.compra.proveedor_id ||
      parseInt(String(data.usuario_id)) !== props.compra.usuario_id ||
      parseInt(String(data.moneda_id)) !== props.compra.moneda_id ||
      (data.tipo_pago_id ? parseInt(String(data.tipo_pago_id)) : null) !== (props.compra.tipo_pago_id || null) ||
      (data.almacen_id ? parseInt(String(data.almacen_id)) : null) !== (props.compra.almacen_id || null)
    );
  };

  // Detectar si los detalles han cambiado
  const hasDetallesChanges = (): boolean => {
    if (!isEditing || !props.compra || !props.compra.detalles) return false;

    const originalDetalles = props.compra.detalles;
    const currentDetalles = data.detalles.filter(d => d.producto_id !== '');

    // Comparar cantidad de detalles
    if (originalDetalles.length !== currentDetalles.length) {
      return true;
    }

    // Comparar cada detalle línea por línea
    for (let i = 0; i < originalDetalles.length; i++) {
      const original = originalDetalles[i];
      const current = currentDetalles[i];

      if (!current ||
        parseInt(String(current.producto_id)) !== original.producto_id ||
        parseInt(String(current.cantidad)) !== original.cantidad ||
        parseFloat(String(current.precio_unitario)) !== parseFloat(String(original.precio_unitario)) ||
        parseFloat(String(current.descuento || 0)) !== parseFloat(String(original.descuento || 0))
      ) {
        return true;
      }
    }

    return false;
  };

  const submit = (e: React.FormEvent) => {
    console.log('🔵 CompraForm::submit() - INICIADO');
    e.preventDefault();

    if (!canCreate && !isEditing) {
      console.warn('❌ CompraForm::submit() - Permisos insuficientes para crear');
      NotificationService.error('No tiene permisos para crear compras');
      return;
    }

    if (!canUpdate && isEditing) {
      console.warn('❌ CompraForm::submit() - Permisos insuficientes para editar');
      NotificationService.error('No tiene permisos para editar compras');
      return;
    }

    // Filtrar detalles válidos
    const detallesValidos = data.detalles.filter(d => d.producto_id !== '');

    console.log('📦 CompraForm::submit() - Validación de detalles', {
      totalDetalles: data.detalles.length,
      detallesValidos: detallesValidos.length,
    });

    if (detallesValidos.length === 0) {
      console.warn('❌ CompraForm::submit() - Sin detalles válidos');
      NotificationService.error('Debe agregar al menos un producto');
      return;
    }

    console.log('✅ CompraForm::submit() - Todas las validaciones pasaron');

    // Detectar si estamos en Escenario 2: Solo cambio de estado (sin modificaciones en detalles/header)
    const esEscenarioEstadoOnly = isEditing && props.compra &&
      data.estado_documento_id !== String(props.compra.estado_documento_id) &&
      !hasHeaderChanges() &&
      !hasDetallesChanges();

    console.log('🔍 CompraForm::submit() - Detectando escenario', {
      isEditing,
      esEscenarioEstadoOnly,
      estadoAnterior: props.compra?.estado_documento_id,
      estadoNuevo: data.estado_documento_id,
      hasHeaderChanges: hasHeaderChanges(),
      hasDetallesChanges: hasDetallesChanges(),
    });

    // Mostrar modal de loading
    let loadingToast: string;

    const options = {
      onStart: () => {
        console.log('🚀 CompraForm::submit() - onStart: Iniciando envío');
        loadingToast = NotificationService.loading(
          isEditing
            ? 'Actualizando compra...'
            : 'Guardando compra...'
        );
      },
      onSuccess: () => {
        console.log('✅ CompraForm::submit() - onSuccess: Solicitud exitosa');
        if (loadingToast) {
          NotificationService.dismiss(loadingToast);
        }

        // ✅ NUEVO: Limpiar localStorage después de envío exitoso
        localStorage.removeItem('compra-create-draft');
        console.log('✅ Borrador de compra eliminado del localStorage');

        // El mensaje del backend se manejará via session flash
        NotificationService.success(
          isEditing ? 'Compra actualizada exitosamente' : 'Compra creada exitosamente'
        );
      },
      onError: (errors: Record<string, string>) => {
        console.error('❌ CompraForm::submit() - onError: Error en respuesta', errors);
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
        console.log('🏁 CompraForm::submit() - onFinish: Completado');
        if (loadingToast) {
          NotificationService.dismiss(loadingToast);
        }
      },
      // Transformar datos antes de enviar
      transform: (data: CompraFormData) => {
        const transformedData: any = {
          numero: data.numero || undefined,
          fecha: data.fecha,
          numero_factura: data.numero_factura || '',
          subtotal: parseFloat(String(data.subtotal)),
          descuento: parseFloat(String(data.descuento || 0)),
          impuesto: parseFloat(String(data.impuesto || 0)),
          total: parseFloat(String(data.total)),
          observaciones: data.observaciones || '',
          proveedor_id: parseInt(String(data.proveedor_id)),
          usuario_id: parseInt(String(data.usuario_id)),
          estado_documento_id: parseInt(String(data.estado_documento_id)),
          moneda_id: parseInt(String(data.moneda_id)),
          tipo_pago_id: data.tipo_pago_id ? parseInt(String(data.tipo_pago_id)) : null,
          almacen_id: data.almacen_id ? parseInt(String(data.almacen_id)) : null,
        };

        // Escenario 1: Usuario modifica detalles/header → Enviar detalles
        // Escenario 2: Solo cambio de estado → NO enviar detalles
        if (!esEscenarioEstadoOnly) {
          transformedData.detalles = detallesValidos.map(detalle => ({
            id: detalle.id || undefined,
            producto_id: parseInt(String(detalle.producto_id)),
            cantidad: parseInt(String(detalle.cantidad)),
            precio_unitario: parseFloat(String(detalle.precio_unitario)),
            descuento: parseFloat(String(detalle.descuento || 0)),
            subtotal: parseFloat(String(detalle.subtotal)),
            lote: detalle.lote || '',
            fecha_vencimiento: detalle.fecha_vencimiento || null,
          }));
        } else {
          console.log('⚠️  CompraForm::submit() - Escenario estado-only: NO enviando detalles');
        }

        return transformedData;
      },
    };

    console.log('📤 CompraForm::submit() - Preparando envío de datos', {
      endpoint: isEditing ? `/compras/${props.compra?.id}` : '/compras',
      metodo: isEditing ? 'PUT' : 'POST',
      dataKeys: Object.keys(options.transform ? options.transform({} as CompraFormData) : {}),
    });

    if (isEditing && props.compra) {
      console.log(`📤 CompraForm::submit() - Enviando PUT a /compras/${props.compra.id}`);
      put(`/compras/${props.compra.id}`, options);
    } else {
      console.log('📤 CompraForm::submit() - Enviando POST a /compras');
      post('/compras', options);
    }

    console.log('⏳ CompraForm::submit() - Solicitud enviada, esperando respuesta...');
  };

  const selectedMoneda = props.monedas.find(m => m.id === Number(data.moneda_id));

  // Estados para validación de caja abierta
  interface CajaInfo {
    tiene_caja_abierta: boolean;
    es_de_hoy?: boolean;
    dias_atras?: number;
    caja_nombre?: string;
    usuario_caja?: string;
    mensaje?: string;
  }

  const [cajaInfo, setCajaInfo] = useState<CajaInfo | null>(null);
  const [cargandoCaja, setCargandoCaja] = useState(true);

  // Verificar si hay caja abierta (de cualquier día)
  useEffect(() => {
    const verificarCaja = async () => {
      try {
        const response = await fetch('/compras/check-caja-abierta');
        const data = await response.json();
        setCajaInfo(data);
        console.log('✅ Estado de caja:', data);
      } catch (error) {
        console.error('❌ Error verificando caja:', error);
        // Si hay error, permitir acceso (mejor UX que bloquear)
        setCajaInfo({ tiene_caja_abierta: true });
      } finally {
        setCargandoCaja(false);
      }
    };

    verificarCaja();
  }, []);

  // Mostrar alert si no hay caja abierta
  if (!cargandoCaja && !cajaInfo?.tiene_caja_abierta) {
    return (
      <AppLayout breadcrumbs={[
        { title: 'Compras', href: '/compras' },
        { title, href: '#' }
      ]}>
        <Head title={title} />
        <div className="p-6 space-y-4">
          <Alert className="border-red-500 bg-red-50 dark:bg-red-900/20">
            <AlertTitle className="text-red-700 dark:text-red-400">🚫 Caja Cerrada</AlertTitle>
            <AlertDescription className="text-red-600 dark:text-red-300 mt-2">
              No puedes crear una compra sin una caja abierta. Por favor, abre una caja primero desde el módulo de Cajas.
            </AlertDescription>
          </Alert>
          <Link
            href="/cajas"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            Ir a Cajas
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={[
      { title: 'Compras', href: '/compras' },
      { title, href: '#' }
    ]}>
      <Head title={title} />

      <form onSubmit={submit} className="space-y-6 p-6">
        {/* Campo hidden para moneda_id */}
        <input type="hidden" name="moneda_id" value={data.moneda_id} />

        {/* Indicador de verificación de caja */}
        {cargandoCaja && (
          <Alert className="border-blue-300 bg-blue-50 dark:bg-blue-900/20">
            <AlertDescription className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></span>
              Verificando estado de caja...
            </AlertDescription>
          </Alert>
        )}

        {/* Indicador de caja abierta */}
        {/* {!cargandoCaja && cajaInfo && cajaInfo.tiene_caja_abierta ? (
          <Alert className={`${cajaInfo.es_de_hoy
            ? 'border-green-300 bg-green-50 dark:bg-green-900/20'
            : 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20'
            }`}>
            <AlertDescription className={`${cajaInfo.es_de_hoy
              ? 'text-green-700 dark:text-green-300'
              : 'text-yellow-700 dark:text-yellow-300'
              } flex items-center gap-2`}>
              <span className={`text-lg ${cajaInfo.es_de_hoy ? '✅' : '⚠️'}`}></span>
              <div>
                <strong>{cajaInfo.mensaje}</strong>
                {cajaInfo.caja_nombre && (
                  <div className="text-sm mt-1">
                    Caja: <strong>{cajaInfo.caja_nombre}</strong>
                    {cajaInfo.usuario_caja && ` • Operador: ${cajaInfo.usuario_caja}`}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        ) : null} */}

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
        {isEditing && props.compra?.estadoDocumento ? (() => {
          const estadoDoc = props.compra.estadoDocumento;
          return (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Estado: {estadoDoc.nombre}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {estadoActual === 'Borrador' && 'Compra en desarrollo. Puede editar todos los campos.'}
                    {estadoActual === 'Pendiente' && 'Esperando aprobación. Puede cambiar a Aprobado.'}
                    {estadoActual === 'Aprobado' && 'Compra aprobada. Stock registrado. Solo puede editar observaciones.'}
                    {estadoActual === 'Facturado' && 'Compra facturada. Solo lectura.'}
                    {estadoActual === 'Cancelado' && 'Compra cancelada. Solo lectura.'}
                    {estadoActual === 'Anulado' && 'Compra anulada. Solo lectura.'}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(estadoDoc)}`}>
                  {estadoDoc.nombre}
                </div>
              </div>
            </div>
          );
        })() : null}

        {/* Información general */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          {/* <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Información General</h3> */}

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
                  onChange={e => setData('numero', (e.target as HTMLInputElement).value)}
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
                disabled={soloLectura || editableAprobado}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed dark:disabled:bg-gray-800 dark:disabled:text-gray-400"
                value={data.fecha}
                onChange={e => setData('fecha', e.target.value)}
              />
              {errors.fecha && <p className="text-red-600 text-xs mt-1">{errors.fecha}</p>}
            </div>

            <div>
              <InputSearch
                id="proveedor_search"
                label="Proveedor"
                value={proveedorValue}
                displayValue={proveedorDisplay}
                onSearch={proveedorSearch.search}
                onChange={(value, option) => {
                  setData('proveedor_id', value || '');
                  setProveedorValue(value);
                  if (option) {
                    setProveedorDisplay(option.label);
                  } else {
                    setProveedorDisplay('');
                  }
                }}
                placeholder="Escribir nombre del proveedor..."
                emptyText="No se encontraron proveedores"
                error={errors.proveedor_id}
                disabled={soloLectura || editableAprobado}
                required={true}
                allowScanner={false}
                showCreateButton={true}
                onCreateClick={handleCreateProveedor}
                createButtonText="Crear Proveedor"
                showCreateIconButton={true}
                createIconButtonTitle="Crear nuevo proveedor"
                className="w-full"
              />
              {/* ✅ Indicador de proveedor seleccionado */}
              {proveedorDisplay && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex items-center gap-2">
                  <span className="text-green-600 dark:text-green-400">✅</span>
                  <span className="text-sm text-green-700 dark:text-green-300">
                    Proveedor: <strong>{proveedorDisplay}</strong>
                  </span>
                </div>
              )}
            </div>

            <div>
              <SearchSelect
                id="tipo_pago_id"
                label="Tipo de Pago"
                disabled={soloLectura || editableAprobado}
                value={data.tipo_pago_id}
                options={tipoPagoOptions}
                onChange={(value: any) => setData('tipo_pago_id', value || '')}
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
                onChange={(value: any) => setData('estado_documento_id', value || '')}
                placeholder="Seleccionar estado"
                emptyText="No se encontraron estados"
                searchPlaceholder="Buscar estado..."
                error={errors.estado_documento_id}
              />
            </div>

            <div>
              <SearchSelect
                id="almacen_id"
                label="Almacén"
                required
                disabled={soloLectura || editableAprobado}
                value={data.almacen_id}
                options={almacenOptions}
                onChange={(value: any) => setData('almacen_id', value || '')}
                placeholder="Seleccionar almacén"
                emptyText="No se encontraron almacenes"
                searchPlaceholder="Buscar almacén..."
                error={errors.almacen_id}
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
          <br />
          <ProductosTable
            tipo="compra" // ✅ NUEVO: Indicar que es una compra (no filtrar por stock)
            productos={props.productos.map(p => ({
              id: p.id,
              nombre: p.nombre,
              codigo: p.codigo ?? undefined, // ✅ Convertir null a undefined
              codigo_barras: p.codigo_barras ?? undefined,
              precio_venta: p.precio_venta as number | undefined,
              precio_compra: p.precio_compra as number | undefined
            }))}
            detalles={data.detalles}
            readOnly={soloLectura || editableAprobado}
            onAddProduct={(producto) => {
              // Adaptar la función para agregar producto
              const precioCompra = Number(producto.precio_compra) || 0; // ✅ Cast a number
              const precioCosto = Number(producto.precio_costo) || 0; // ✅ Cast a number
              const newDetalle: DetalleForm = {
                producto_id: producto.id,
                cantidad: 1,
                precio_unitario: precioCompra,
                descuento: 0,
                subtotal: precioCompra,
                lote: '',
                fecha_vencimiento: '',
                precio_costo: precioCosto, // ✅ NUEVO: Precio de costo desde API
                unidad_medida_id: producto.unidad_medida_id, // ✨ NUEVO: Para mostrar unidad como referencia
                unidad_medida_nombre: producto.unidad_medida_nombre, // ✨ NUEVO: Nombre de unidad para referencia
                es_fraccionado: producto.es_fraccionado || false, // ✨ NUEVO: Indicador de producto fraccionado
                conversiones: producto.conversiones || [], // ✨ NUEVO: Conversiones para calcular precio/unidad como referencia
                producto: { // ✅ NUEVO: Guardar objeto completo del producto
                  id: producto.id,
                  nombre: producto.nombre,
                  codigo: producto.codigo,
                  codigo_barras: producto.codigo_barras,
                  precio_costo: precioCosto,
                  es_fraccionado: producto.es_fraccionado || false
                }
              };
              const newDetalles = [...data.detalles, newDetalle];
              setData('detalles', newDetalles);
            }}
            onUpdateDetail={(index, field, value) => {
              updateDetalle(index, field as keyof DetalleForm, value);
            }}
            onRemoveDetail={(index) => {
              removeRow(index);
            }}
            onTotalsChange={() => {
              // Los totales se recalculan automáticamente por el useEffect
            }}
            errors={errors}
            showLoteFields={true}
          />
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
                    type="text"
                    inputMode="decimal" // ✅ Mostrar teclado decimal en móvil
                    className="w-20 px-2 py-1 text-right text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={data.descuento}
                    onChange={e => {
                      // ✅ Solo permitir números decimales positivos
                      const valor = e.target.value;
                      if (valor === '' || /^\d*\.?\d*$/.test(valor)) {
                        const num = valor === '' ? 0 : parseFloat(valor);
                        if (num >= 0) {
                          setData('descuento', num);
                        }
                      }
                    }}
                  />
                  <span className="font-mono">{formatCurrency(data.descuento, selectedMoneda?.simbolo)}</span>
                </div>
              </div>
              {/* <div className="flex justify-between text-sm">
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
              </div> */}
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

      {/* Modal para crear proveedor */}
      <ModalCrearProveedor
        isOpen={showCreateProveedorModal}
        onClose={() => setShowCreateProveedorModal(false)}
        onProveedorCreated={handleProveedorCreated}
        searchQuery={proveedorSearchQuery}
      />
    </AppLayout>
  );
}
