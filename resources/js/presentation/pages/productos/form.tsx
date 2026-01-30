import { Head, Link, useForm, router } from '@inertiajs/react';
import Step1DatosProducto from './steps/Step1DatosProducto';
import Step2PreciosCodigos from './steps/Step2PreciosCodigos';
import Step3Conversiones from './steps/Step3Conversiones'; // ✨ NUEVO
import Step4Imagenes from './steps/Step4Imagenes';
import Step5PrecioRango from './steps/Step5PrecioRango'; // ✨ NUEVO
import { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/presentation/components/ui/tabs';
import { useEntitySelect } from '@/presentation/hooks/use-search-select';
import NotificationService from '@/infrastructure/services/notification.service';
import productosService from '@/infrastructure/services/productos.service';
import type { ProductoFormData, Precio, Imagen, CodigoBarra, ProductoFormPageProps } from '@/domain/entities/productos';
import type { Id } from '@/domain/entities/shared';

// Estado del formulario tipado para evitar 'any' implícitos
// Usamos el tipo original de ProductoFormData

// Precios por defecto mejorados con tipos usando IDs
// Porcentaje de interés global recibido por props (opcional) se mostrará en la UI y puede ayudar a calcular precios
const initialProductoData: ProductoFormData = {
  nombre: '',
  sku: '',
  descripcion: '',
  peso: null,
  unidad_medida_id: '',
  numero: '',
  fecha_vencimiento: null,
  categoria_id: '',
  marca_id: '',
  proveedor_id: '',
  proveedor: null, // ✅ NUEVO: Campo para almacenar el objeto del proveedor
  activo: true,
  es_fraccionado: false, // ✨ NUEVO
  stock_minimo: 0,
  stock_maximo: 50,
  limite_venta: null, // ✨ NUEVO
  principio_activo: null, // ✨ NUEVO
  uso_de_medicacion: null, // ✨ NUEVO
  precios: [
    { monto: 0, tipo_precio_id: 1 },
    { monto: 0, tipo_precio_id: 2 },
  ],
  codigos: [{ codigo: '' }],
  conversiones: [], // ✨ NUEVO
};

export default function ProductoForm({
  producto,
  categorias,
  marcas,
  unidades,
  tipos_precio,
  configuraciones_ganancias,
  historial_precios,
  permite_productos_fraccionados, // ✨ NUEVO
  es_farmacia // ✨ NUEVO - Indica si la empresa es farmacia
}: ProductoFormPageProps) {
  // 🔍 LOGS PARA DEBUG
  console.log('🎯 ProductoForm - Producto recibido del backend:', producto);
  console.log('👤 Proveedor en producto:', producto?.proveedor);
  console.log('🆔 proveedor_id en producto:', producto?.proveedor_id);
  console.log('💰 tipos_precio recibidos del backend:', tipos_precio);
  // Nota: Los proveedores se buscan por API, no se precarga aquí

  // Normalizadores para compatibilidad: el backend puede enviar {id,nombre,...} o {value,label,...}
  const isEditing = !!producto?.id;
  const porcentajeInteres = Number(configuraciones_ganancias?.porcentaje_interes_general ?? 0);
  // Estado para controlar el tab activo (siempre inicia en "datos")
  const [activeTab, setActiveTab] = useState<string>('datos');

  // ✅ Estado separado para imágenes (no van en useForm por ser objetos complejos)
  const [perfilState, setPerfilState] = useState<Imagen | undefined>(producto?.perfil ?? undefined);
  const [galeriaState, setGaleriaState] = useState<Imagen[]>(producto?.galeria ?? []);

  const DRAFT_KEY = 'producto_form_draft_v1';

  // Configurar hooks de búsqueda para cada entidad
  const categoriasSelect = useEntitySelect(categorias);
  const marcasSelect = useEntitySelect(marcas);

  const unidadesSelect = useEntitySelect(unidades, {
    searchFields: ['nombre', 'codigo'],
    descriptionField: 'codigo'
  });

  const { data, setData, processing, errors, recentlySuccessful, clearErrors } = useForm<ProductoFormData>(
    producto ? {
      nombre: producto.nombre,
      sku: producto.sku ?? '',
      descripcion: producto.descripcion ?? '',
      peso: producto.peso ?? null,
      unidad_medida_id: producto.unidad_medida_id ? Number(producto.unidad_medida_id) : '',
      numero: '',
      fecha_vencimiento: null,
      categoria_id: producto.categoria_id ? Number(producto.categoria_id) : '',
      marca_id: producto.marca_id ? Number(producto.marca_id) : '',
      proveedor_id: producto.proveedor_id ? Number(producto.proveedor_id) : '',
      proveedor: producto.proveedor || null, // ✅ NUEVO: Incluir objeto del proveedor para el displayValue
      activo: producto.activo ?? true,
      es_fraccionado: producto.es_fraccionado ?? false, // ✨ NUEVO
      stock_minimo: producto.stock_minimo ?? 0,
      stock_maximo: producto.stock_maximo ?? 50,
      limite_venta: producto.limite_venta ?? null, // ✨ NUEVO
      principio_activo: producto.principio_activo ?? null, // ✨ NUEVO
      uso_de_medicacion: producto.uso_de_medicacion ?? null, // ✨ NUEVO
      precios: producto.precios?.length ? producto.precios : initialProductoData.precios,
      codigos: producto.codigos?.length ? producto.codigos : [{ codigo: '' }],
      conversiones: producto.conversiones?.length ? producto.conversiones : [], // ✨ NUEVO
    } : initialProductoData
  );

  console.log('💾 useForm data inicializada:', data);
  console.log('🆔 proveedor_id en data del useForm:', data.proveedor_id);

  // Autosave: restaurar borrador en carga inicial (solo creación)
  // Nota: Siempre abre en el tab "datos", solo restaura los datos del formulario
  useEffect(() => {
    if (typeof window === 'undefined') { return; }
    if (isEditing) { return; }
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) { return; }
      const draftUnknown = JSON.parse(raw) as unknown;
      if (!draftUnknown || typeof draftUnknown !== 'object') { return; }
      const draft = draftUnknown as Record<string, unknown>;
      // NO restauramos el tab, siempre iniciamos en "datos"
      const restoredData = (draft.data as Record<string, unknown> | undefined);
      if (restoredData && typeof restoredData === 'object') {
        try {
          const set = setData as unknown as (key: string, value: unknown) => void;
          Object.entries(restoredData).forEach(([k, v]) => {
            set(k, v);
          });
        } catch (err) {
          console.warn('No se pudo restaurar completamente el borrador', err);
        }
        // Borrador restaurado silenciosamente
      }
    } catch (e) {
      console.warn('Borrador inválido, se ignora.', e);
    }
  }, [isEditing, setData]);

  // Autosave: guardar borrador al cambiar datos o tab (solo creación)
  useEffect(() => {
    if (typeof window === 'undefined') { return; }
    if (isEditing) { return; }
    try {
      const payload = { activeTab, data, ts: Date.now() };
      const replacer = (key: string, value: unknown) => (key === 'file' ? undefined : value);
      // Omitimos cualquier propiedad llamada "file" (File/Blob) para evitar errores de serialización
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify(payload, replacer as unknown as (this: unknown, key: string, value: unknown) => unknown)
      );
    } catch (err) {
      console.warn('No se pudo guardar el borrador', err);
    }
  }, [data, activeTab, isEditing, setData]);

  // Mostrar notificaciones de éxito
  useEffect(() => {
    if (recentlySuccessful) {
      NotificationService.success(
        isEditing ? 'Producto actualizado correctamente' : 'Producto creado correctamente'
      );
    }
  }, [recentlySuccessful, isEditing]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Limpiar errores previos
    (clearErrors as unknown as () => void)();

    // ✅ VALIDACIÓN CRÍTICA: El nombre es obligatorio
    console.log('📝 Nombre en data:', data.nombre, 'Tipo:', typeof data.nombre);

    const nombreTrimmed = data.nombre ? String(data.nombre).trim() : '';
    if (!nombreTrimmed) {
      NotificationService.error('❌ El nombre del producto es obligatorio');
      setActiveTab('datos');
      return; // ✅ IMPORTANTE: Detener aquí, no continuar
    }

    // Advertencia si no hay precios, pero permitir guardar
    const preciosValidos = (data.precios || []).filter((p: Precio) => Number(p.monto) > 0);
    if (preciosValidos.length === 0) {
      const confirmed = await NotificationService.confirm(
        '⚠️ El producto no tiene ningún precio definido. No podrá venderse hasta que definas al menos un precio. ¿Deseas continuar?',
        {
          confirmText: 'Guardar sin precio',
          cancelText: 'Cancelar'
        }
      );

      if (!confirmed) {
        setActiveTab('precios');
        return;
      }
    }

    const formData = new FormData();

    // Campos básicos
    Object.entries({
      nombre: nombreTrimmed, // ✅ Usar el nombre ya validado y trimmed
      sku: data.sku?.trim() ?? '',
      descripcion: data.descripcion?.trim() ?? '',
      peso: data.peso ?? '',
      unidad_medida_id: data.unidad_medida_id || '',
      fecha_vencimiento: data.fecha_vencimiento ?? '',
      categoria_id: data.categoria_id || '',
      marca_id: data.marca_id || '',
      proveedor_id: data.proveedor_id || '',
      activo: data.activo ? 1 : 0,
      stock_minimo: data.stock_minimo ?? '',
      stock_maximo: data.stock_maximo ?? '',
      limite_venta: data.limite_venta ?? '', // ✨ NUEVO - Vacío = sin límite
    }).forEach(([k, v]) => formData.append(k, String(v ?? '')));

    // Imágenes (desde estado separado)
    if (perfilState && perfilState.file) {
      formData.append('perfil', perfilState.file);
    }
    if (galeriaState && galeriaState.length > 0) {
      galeriaState.forEach((img: Imagen, i: number) => {
        if (img.file) {
          formData.append(`galeria[${i}]`, img.file);
        }
      });
    }

    // Precios (solo los válidos)
    preciosValidos.forEach((p: Precio, i: number) => {
      formData.append(`precios[${i}][monto]`, String(p.monto));
      if (p.tipo_precio_id != null) {
        formData.append(`precios[${i}][tipo_precio_id]`, String(p.tipo_precio_id));
      }
      if (p.unidad_medida_id != null) {
        formData.append(`precios[${i}][unidad_medida_id]`, String(p.unidad_medida_id));
      }
      if (p.moneda) {
        formData.append(`precios[${i}][moneda]`, p.moneda);
      }
    });

    // Códigos de barra (solo los que tienen contenido)
    const codigos = (data.codigos as CodigoBarra[] || []);
    const codigosValidos = codigos.filter((c) => c.codigo && c.codigo.trim());
    codigosValidos.forEach((c: { codigo: string }, i: number) => {
      formData.append(`codigos[${i}]`, c.codigo.trim());
    });

    // Si no hay códigos válidos, no enviar el campo (el backend creará uno automáticamente)
    if (codigosValidos.length === 0) {
      // No enviamos nada, el backend se encargará
    }

    // Conversiones de unidad (si es fraccionado)
    formData.append('es_fraccionado', data.es_fraccionado ? '1' : '0');

    if (data.es_fraccionado && data.conversiones && data.conversiones.length > 0) {
      (data.conversiones as any[]).forEach((conv, i) => {
        formData.append(`conversiones[${i}][unidad_base_id]`, String(conv.unidad_base_id));
        formData.append(`conversiones[${i}][unidad_destino_id]`, String(conv.unidad_destino_id));
        formData.append(`conversiones[${i}][factor_conversion]`, String(conv.factor_conversion));
        formData.append(`conversiones[${i}][activo]`, conv.activo ? '1' : '0');
        formData.append(`conversiones[${i}][es_conversion_principal]`, conv.es_conversion_principal ? '1' : '0');
      });

      console.log('✅ Conversiones enviadas:', data.conversiones);
    }

    let savingToast: Id | undefined;
    const options = {
      forceFormData: true,
      onStart: () => {
        savingToast = NotificationService.loading('Guardando producto...');
      },
      onSuccess: () => {
        // ✨ Mostrar toast de éxito INMEDIATAMENTE (antes de la redirección)
        NotificationService.success(
          isEditing ? 'Producto actualizado correctamente' : 'Producto creado correctamente'
        );

        // limpiar draft en localStorage
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch (err) {
          // prevenir fallo si el storage no está disponible (por ejemplo en SSR)
          console.warn('No se pudo eliminar draft:', err);
        }

        // ✅ Recargar la página DESPUÉS de actualizar para obtener datos frescos de la BD
        // Esto evita que Inertia use datos cacheados en memoria
        if (isEditing) {
          // Esperar un pequeño delay para que el toast se vea antes de recargar
          setTimeout(() => {
            router.reload();
          }, 500);
        }
      },
      onError: (errors: Record<string, string | string[]>) => {
        console.error('Error al guardar producto:', errors);
        Object.entries(errors).forEach(([field, message]) => {
          if (typeof message === 'string') {
            NotificationService.error(`${field}: ${message}`);
          }
        });
      },
      onFinish: () => {
        if (savingToast) {
          NotificationService.dismiss(savingToast);
        }
      }
    };

    if (isEditing && producto?.id) {
      formData.append('_method', 'PUT');
      router.post(productosService.updateUrl(producto.id), formData, options);
    } else {
      router.post(productosService.storeUrl(), formData, options);
    }
  };

  // Precios y códigos: funciones reales usadas por Step2
  const setPrecios = (precios: Precio[]) => {
    setData('precios', precios);
  };

  const setPrecio = (i: number, key: string, value: string | number) => {
    const next = [...data.precios];
    // Mantener el valor tal cual (string o number) para no romper el input controlado
    next[i] = { ...next[i], [key]: value } as Precio;
    setData('precios', next);
  };

  // Agregar/Quitar un tipo de precio por checkbox
  const toggleTipoPrecio = (tipoId: number, checked: boolean) => {
    const exists = (data.precios || []).some((p: Precio) => Number(p.tipo_precio_id) === Number(tipoId));
    if (checked && !exists) {
      const nuevo = { monto: 0, tipo_precio_id: tipoId } as Precio;
      const nuevosPrecios = [...data.precios, nuevo];
      setData('precios', nuevosPrecios);
    } else if (!checked && exists) {
      // ✅ IMPORTANTE: Eliminar TODOS los precios de este tipo (todas las unidades)
      const preciosFiltrados = (data.precios || []).filter(
        (p: Precio) => Number(p.tipo_precio_id) !== Number(tipoId)
      );
      setData('precios', preciosFiltrados);
    }
  };

  const setCodigo = (i: number, value: string) => {
    const next = [...(data.codigos || [])];
    next[i] = { ...(next[i] || {}), codigo: value };
    setData('codigos', next);
  };

  const addCodigo = () => {
    const nuevosCodigos = [...(data.codigos || []), { codigo: '' }];
    setData('codigos', nuevosCodigos);
  };

  const removeCodigo = async (i: number) => {
    const items = (data.codigos || []);
    if (items.length <= 1) {
      // No permitir eliminar el último código (validación silenciosa)
      return;
    }

    const confirmed = await NotificationService.confirm(
      '¿Estás seguro de eliminar este código?',
      {
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    );

    if (confirmed) {
      const codigosFiltrados = (data.codigos || []).filter((_: unknown, idx: number) => idx !== i);
      setData('codigos', codigosFiltrados);
    }
  };

  const setPerfil = (file: File | undefined) => {
    setPerfilState(file ? { file } : undefined);
  };

  const addGaleria = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const imgs = Array.from(files).map(f => ({ file: f } as Imagen));
    const nuevaGaleria = [...galeriaState, ...imgs];
    setGaleriaState(nuevaGaleria);
  };

  const removeGaleria = async (i: number) => {
    const confirmed = await NotificationService.confirm(
      '¿Estás seguro de eliminar esta imagen de la galería?',
      {
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    );

    if (confirmed) {
      const galeriaFiltrada = galeriaState.filter((_: unknown, idx: number) => idx !== i);
      setGaleriaState(galeriaFiltrada);
    }
  };

  // Función para obtener el color del borde según si hay error
  const getInputClassName = (fieldName: keyof typeof errors) => {
    return errors[fieldName]
      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
      : "border-input focus:border-ring focus:ring-ring";
  };

  // Función para limpiar el borrador guardado
  const clearDraft = async () => {
    if (typeof window === 'undefined') { return; }
    try {
      const confirmed = await NotificationService.confirm(
        '¿Estás seguro de que quieres limpiar el borrador guardado?',
        {
          confirmText: 'Limpiar',
          cancelText: 'Cancelar'
        }
      );

      if (confirmed) {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch (err) {
      console.warn('Error al limpiar el borrador', err);
      // Error silencioso, no mostrar notificación
    }
  };

  return (
    <AppLayout breadcrumbs={[
      { title: 'Dashboard', href: productosService.indexUrl() },
      { title: 'Productos', href: productosService.indexUrl() },
      { title: isEditing ? `Editar: ${producto.nombre}` : 'Nuevo', href: '#' }
    ]}>
      <Head title={isEditing ? `Editar: ${producto.nombre}` : 'Nuevo producto'} />

      <div className="flex justify-center items-center min-h-screen">
        <Card className="max-w-5xl w-full">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {isEditing ? `Editar: ${producto.nombre}` : 'Nuevo'}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {isEditing ? 'Modifica los datos del producto' : 'Agrega un nuevo producto al inventario'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={clearDraft}
                >
                  Limpiar borrador
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href={productosService.indexUrl()}>Volver</Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="datos" className="w-full">
              <TabsList className={`grid w-full ${isEditing && permite_productos_fraccionados && data.es_fraccionado
                  ? 'grid-cols-5'
                  : isEditing || (permite_productos_fraccionados && data.es_fraccionado)
                    ? 'grid-cols-4'
                    : 'grid-cols-3'
                }`}>
                <TabsTrigger value="datos">Datos del producto</TabsTrigger>

                {permite_productos_fraccionados && data.es_fraccionado && (
                  <TabsTrigger value="conversiones">
                    ✨ Conversiones
                  </TabsTrigger>
                )}
                {isEditing && (
                  <TabsTrigger value="precio-rango">Rango de Precios</TabsTrigger>
                )}
                <TabsTrigger value="precios">Precios y códigos</TabsTrigger>
                <TabsTrigger value="imagenes">Imágenes</TabsTrigger>
              </TabsList>

              <form onSubmit={submit} className="space-y-6">
                <TabsContent value="datos" className="space-y-6 mt-6">
                  <Step1DatosProducto
                    data={data}
                    errors={errors}
                    categoriasOptions={categoriasSelect.filteredOptions}
                    marcasOptions={marcasSelect.filteredOptions}
                    unidadesOptions={unidadesSelect.filteredOptions}
                    setData={setData}
                    getInputClassName={getInputClassName}
                    permite_productos_fraccionados={permite_productos_fraccionados} // ✨ NUEVO
                    es_farmacia={es_farmacia} // ✨ NUEVO
                  />
                </TabsContent>

                <TabsContent value="precios" className="space-y-6 mt-6">
                  <Step2PreciosCodigos
                    data={{
                      precios: data.precios,
                      codigos: data.codigos,
                      es_fraccionado: data.es_fraccionado, // ✨ NUEVO
                      unidad_medida_id: data.unidad_medida_id, // ✨ NUEVO
                      conversiones: data.conversiones, // ✨ NUEVO
                    }}
                    errors={errors}
                    tipos_precio={tipos_precio}
                    porcentajeInteres={porcentajeInteres}
                    precioCosto={data.precios?.find((p: Precio) => Number(p.tipo_precio_id) === 1)?.monto ?? 0}
                    isEditing={isEditing}
                    addPrecio={() => { }}
                    removePrecio={() => { }}
                    setPrecio={setPrecio}
                    setPrecios={setPrecios}
                    toggleTipoPrecio={toggleTipoPrecio}
                    getTipoPrecioInfo={() => undefined}
                    calcularGanancia={() => ({ ganancia: 0, porcentaje: 0 })}
                    addCodigo={addCodigo}
                    removeCodigo={removeCodigo}
                    setCodigo={setCodigo}
                    historial_precios={historial_precios}
                    unidades={unidades} // ✨ NUEVO
                  />
                </TabsContent>

                {/* ✨ NUEVA PESTAÑA: Conversiones de Unidades */}
                {permite_productos_fraccionados && (
                  <TabsContent value="conversiones" className="space-y-6 mt-6">
                    {data.es_fraccionado && (
                      <Step3Conversiones
                        data={data}
                        unidadesOptions={unidadesSelect.filteredOptions}
                        unidadBase={
                          unidades.find(u => u.id === Number(data.unidad_medida_id))
                        }
                        setData={setData}
                        errors={errors}
                      />
                    )}
                  </TabsContent>
                )}

                <TabsContent value="imagenes" className="space-y-6 mt-6">
                  <Step4Imagenes
                    data={{ perfil: perfilState ?? undefined, galeria: galeriaState ?? [] }}
                    setPerfil={setPerfil}
                    addGaleria={addGaleria}
                    removeGaleria={removeGaleria}
                  />
                </TabsContent>
              </form>

              {/* ✨ NUEVA PESTAÑA: Rango de Precios - FUERA DEL FORMULARIO PRINCIPAL */}
              <TabsContent value="precio-rango" className="space-y-6 mt-6">
                {producto?.id && (
                  <Step5PrecioRango
                    productoId={producto.id}
                    tiposPrecio={
                      tipos_precio?.map((t: any) => ({
                        id: t.value ?? t.id,
                        nombre: t.label ?? t.nombre,
                        codigo: t.code ?? t.codigo,
                      })) || []
                    }
                    isEditing={isEditing}
                  />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter>
            <div className="flex justify-between w-full">
              <Button asChild variant="outline" disabled={processing}>
                <Link href={productosService.indexUrl()}>
                  {processing ? 'Procesando...' : 'Cancelar'}
                </Link>
              </Button>
              <Button
                type="submit"
                disabled={processing}
                onClick={submit}
                className="min-w-[140px]"
              >
                {processing ? (
                  <span className="flex items-center gap-2">Procesando...</span>
                ) : (
                  'Guardar producto'
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}
