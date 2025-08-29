// Pages: Productos form page
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import SearchSelect from '@/components/ui/search-select';
import { useEntitySelect } from '@/hooks/use-search-select';
import NotificationService from '@/services/notification.service';
import productosService from '@/services/productos.service';
import type { Producto, ProductoFormData, Precio, CodigoBarra, Imagen } from '@/domain/productos';

interface TipoPrecio {
  value: number; // Cambiado de string a number (ID)
  code: string; // Código del tipo
  label: string;
  description?: string;
  color: string;
  es_ganancia: boolean;
  es_precio_base: boolean;
  icono?: string;
  tooltip?: string;
}

interface ProductoFormPageProps {
  producto?: Producto | null;
  categorias: {id: number; nombre: string}[];
  marcas: {id: number; nombre: string}[];
  unidades: {id: number; codigo: string; nombre: string}[];
  tipos_precio: TipoPrecio[];
}

// Precios por defecto mejorados con tipos usando IDs
const initialProductoData: ProductoFormData = {
  nombre: '',
  descripcion: '',
  peso: null,
  unidad_medida_id: '',
  numero: '',
  fecha_vencimiento: null,
  categoria_id: '',
  marca_id: '',
  activo: true,
  perfil: null,
  galeria: [],
  precios: [
    { nombre: 'Precio Costo', monto: 0, tipo_precio_id: 1 }, // ID en lugar de código
    { nombre: 'Precio Venta', monto: 0, tipo_precio_id: 2 }
  ],
  codigos: [{ codigo: '' }],
};

export default function ProductoForm({ producto, categorias, marcas, unidades, tipos_precio }: ProductoFormPageProps) {
  const isEditing = !!producto?.id;

  // Configurar hooks de búsqueda para cada entidad
  const categoriasSelect = useEntitySelect(categorias);
  const marcasSelect = useEntitySelect(marcas);
  const unidadesSelect = useEntitySelect(unidades, {
    searchFields: ['nombre', 'codigo'],
    descriptionField: 'codigo'
  });

  const { data, setData, post, processing, errors, wasSuccessful, recentlySuccessful, clearErrors } = useForm<ProductoFormData>(
    producto ? {
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? '',
      peso: producto.peso ?? null,
      unidad_medida_id: producto.unidad_medida_id ?? '',
      numero: '',
      fecha_vencimiento: null,
      categoria_id: producto.categoria_id ?? '',
      marca_id: producto.marca_id ?? '',
      activo: producto.activo ?? true,
      perfil: producto.perfil ?? null,
      galeria: producto.galeria ?? [],
      precios: producto.precios?.length ? producto.precios : initialProductoData.precios,
      codigos: producto.codigos?.length ? producto.codigos : [{ codigo: '' }],
    } : initialProductoData
  );

  // Mostrar notificaciones de éxito
  useEffect(() => {
    if (recentlySuccessful) {
      NotificationService.success(
        isEditing ? 'Producto actualizado correctamente' : 'Producto creado correctamente'
      );
    }
  }, [recentlySuccessful, isEditing]);

  // Mostrar errores específicos del backend
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      // Mostrar el primer error específico del backend
      const firstErrorKey = Object.keys(errors)[0];
      const firstError = errors[firstErrorKey];

      if (typeof firstError === 'string') {
        NotificationService.error(`Error en ${firstErrorKey}: ${firstError}`);
      } else if (Array.isArray(firstError) && firstError.length > 0) {
        // Si es un array, tomar el primer mensaje
        const message = typeof firstError[0] === 'string' ? firstError[0] : JSON.stringify(firstError[0]);
        NotificationService.error(`Error en ${firstErrorKey}: ${message}`);
      } else if (typeof firstError === 'object' && firstError !== null) {
        // Si es un objeto, convertirlo a string
        NotificationService.error(`Error en ${firstErrorKey}: ${JSON.stringify(firstError)}`);
      } else {
        NotificationService.error('Por favor, revisa los errores marcados en rojo en el formulario');
      }
    }
  }, [errors]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Limpiar errores previos
    clearErrors();

    // Validaciones básicas
    if (!data.nombre.trim()) {
      NotificationService.error('El nombre del producto es requerido');
      return;
    }

    // Validar precios - debe tener al menos un precio válido con nombre
    const preciosValidos = data.precios.filter(p => p.monto > 0 && p.nombre?.trim());
    if (preciosValidos.length === 0) {
      NotificationService.warning('Debe agregar al menos un precio válido con nombre');
      return;
    }

    const formData = new FormData();

    // Campos básicos
    Object.entries({
      nombre: data.nombre.trim(),
      descripcion: data.descripcion?.trim() ?? '',
      peso: data.peso ?? '',
      unidad_medida_id: data.unidad_medida_id || '',
      fecha_vencimiento: data.fecha_vencimiento ?? '',
      categoria_id: data.categoria_id || '',
      marca_id: data.marca_id || '',
      activo: data.activo ? 1 : 0,
    }).forEach(([k, v]) => formData.append(k, String(v ?? '')));

    // Imágenes
    if (data.perfil?.file) {
      formData.append('perfil', data.perfil.file);
    }
    data.galeria?.forEach((img, i) => {
      if (img.file) {
        formData.append(`galeria[${i}]`, img.file);
      }
    });

    // Precios (solo los válidos)
    preciosValidos.forEach((p, i) => {
      formData.append(`precios[${i}][nombre]`, p.nombre?.trim() || '');
      formData.append(`precios[${i}][monto]`, String(p.monto));
    });

    // Códigos de barra (solo los que tienen contenido)
    const codigosValidos = data.codigos.filter(c => c.codigo && c.codigo.trim());
    codigosValidos.forEach((c, i) => {
      formData.append(`codigos[${i}]`, c.codigo.trim());
    });

    // Si no hay códigos válidos, no enviar el campo (el backend creará uno automáticamente)
    if (codigosValidos.length === 0) {
      // No enviamos nada, el backend se encargará
    }

    const options = {
      forceFormData: true,
      onSuccess: () => {
        // NotificationService se maneja en el useEffect
      },
      onError: (errors: any) => {
        console.error('Error al guardar producto:', errors);

        // Mostrar errores específicos del backend
        if (typeof errors === 'object' && errors !== null) {
          Object.entries(errors).forEach(([field, message]) => {
            if (typeof message === 'string') {
              NotificationService.error(`${field}: ${message}`);
            }
          });
        } else {
          NotificationService.error('Error al guardar el producto. Revisa los datos ingresados.');
        }
      }
    };

    if (isEditing && producto?.id) {
      formData.append('_method', 'PUT');
      post(productosService.updateUrl(producto.id), options);
    } else {
      post(productosService.storeUrl(), options);
    }
  };

  const setPrecio = (i: number, key: keyof Precio, value: string | number) => {
    const next = [...data.precios];
    if (key === 'monto') {
      // Mejorar manejo de input numérico
      const numericValue = value === '' ? 0 : Number(value);
      next[i] = { ...next[i], [key]: numericValue };
    } else {
      next[i] = { ...next[i], [key]: value };
    }
    setData('precios', next);
  };

  const addPrecio = () => {
    setData('precios', [...data.precios, { nombre: 'Precio General', monto: 0, tipo_precio_id: 2 }]);
    NotificationService.info('Precio agregado. Selecciona el tipo y configura el monto correspondiente.');
  };

  const removePrecio = async (i: number) => {
    if (data.precios.length === 1) {
      NotificationService.warning('Debe mantener al menos un precio');
      return;
    }

    const confirmed = await NotificationService.confirm(
      '¿Estás seguro de eliminar este precio?',
      {
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        title: 'Confirmar eliminación'
      }
    );

    if (confirmed) {
      setData('precios', data.precios.filter((_, idx) => idx !== i));
      NotificationService.success('Precio eliminado');
    }
  };

  // Función para obtener información del tipo de precio
  const getTipoPrecioInfo = (tipoPrecioValue: number): TipoPrecio | undefined => {
    return tipos_precio.find(t => t.value === tipoPrecioValue);
  };

  // Función para calcular ganancia basada en precio de costo
  const calcularGanancia = (precioVenta: number, precioCosto: number): { ganancia: number; porcentaje: number } => {
    if (precioCosto === 0) return { ganancia: 0, porcentaje: 0 };
    const ganancia = precioVenta - precioCosto;
    const porcentaje = (ganancia / precioCosto) * 100;
    return { ganancia, porcentaje };
  };

  // Obtener precio de costo para cálculos
  const precioCosto = data.precios.find(p => p.tipo_precio === 'costo')?.monto ?? 0;

  const setCodigo = (i: number, value: string) => {
    const next = [...data.codigos];
    next[i] = { ...next[i], codigo: value };
    setData('codigos', next);
  };

  const addCodigo = () => {
    setData('codigos', [...data.codigos, { codigo: '' }]);
    NotificationService.info('Código agregado. Ingresa el código de barras.');
  };

  const removeCodigo = async (i: number) => {
    if (data.codigos.length === 1) {
      NotificationService.warning('Debe mantener al menos un código');
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
      setData('codigos', data.codigos.filter((_, idx) => idx !== i));
      NotificationService.success('Código eliminado');
    }
  };

  const setPerfil = (file: File | null) => {
    setData('perfil', file ? { file } : null);
    if (file) {
      NotificationService.success('Imagen de perfil seleccionada');
    }
  };

  const addGaleria = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const imgs = Array.from(files).map(f => ({ file: f } as Imagen));
    setData('galeria', [...(data.galeria || []), ...imgs]);
    NotificationService.success(`${files.length} imagen(es) agregada(s) a la galería`);
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
      setData('galeria', (data.galeria || []).filter((_, idx) => idx !== i));
      NotificationService.success('Imagen eliminada de la galería');
    }
  };

  // Función para obtener el color del borde según si hay error
  const getInputClassName = (fieldName: keyof typeof errors) => {
    return errors[fieldName]
      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500";
  };

  return (
    <AppLayout breadcrumbs={[
      { title: 'Dashboard', href: productosService.indexUrl() },
      { title: 'Productos', href: productosService.indexUrl() },
      { title: isEditing ? 'Editar' : 'Nuevo', href: '#' }
    ]}>
      <Head title={isEditing ? 'Editar producto' : 'Nuevo producto'} />

      <div className="flex justify-center items-center min-h-screen">
        <Card className="max-w-5xl w-full">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {isEditing ? 'Editar' : 'Nuevo'} producto
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {isEditing ? 'Modifica los datos del producto' : 'Agrega un nuevo producto al inventario'}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href={productosService.indexUrl()}>Volver</Link>
            </Button>
          </CardHeader>

          <CardContent>
            <form onSubmit={submit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={data.nombre}
                    onChange={e=>setData('nombre', e.target.value)}
                    required
                    className={getInputClassName('nombre')}
                  />
                  {errors.nombre && <div className="text-red-500 text-sm mt-1">⚠️ {errors.nombre}</div>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Input
                    id="descripcion"
                    value={data.descripcion ?? ''}
                    onChange={e=>setData('descripcion', e.target.value)}
                    className={getInputClassName('descripcion')}
                  />
                  {errors.descripcion && <div className="text-red-500 text-sm mt-1">⚠️ {errors.descripcion}</div>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <SearchSelect
                    id="categoria"
                    label="Categoría"
                    placeholder="Seleccione una categoría"
                    value={data.categoria_id ?? ''}
                    options={categoriasSelect.filteredOptions}
                    onChange={(value) => setData('categoria_id', value ? Number(value) : '')}
                    error={errors.categoria_id}
                    allowClear={true}
                    emptyText="No se encontraron categorías"
                    searchPlaceholder="Buscar categorías..."
                  />
                </div>
                <div className="space-y-1">
                  <SearchSelect
                    id="marca"
                    label="Marca"
                    placeholder="Seleccione una marca"
                    value={data.marca_id ?? ''}
                    options={marcasSelect.filteredOptions}
                    onChange={(value) => setData('marca_id', value ? Number(value) : '')}
                    error={errors.marca_id}
                    allowClear={true}
                    emptyText="No se encontraron marcas"
                    searchPlaceholder="Buscar marcas..."
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="peso">Peso</Label>
                  <Input
                    id="peso"
                    type="number"
                    step="0.001"
                    value={data.peso ?? ''}
                    onChange={e=>setData('peso', e.target.value? Number(e.target.value): null)}
                    className={getInputClassName('peso')}
                  />
                  {errors.peso && <div className="text-red-500 text-sm mt-1">⚠️ {errors.peso}</div>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <SearchSelect
                    id="unidad_medida_id"
                    label="Unidad de medida"
                    placeholder="Seleccione una unidad"
                    value={data.unidad_medida_id ?? ''}
                    options={unidadesSelect.filteredOptions}
                    onChange={(value) => setData('unidad_medida_id', value ? Number(value) : '')}
                    error={errors.unidad_medida_id}
                    allowClear={true}
                    emptyText="No se encontraron unidades"
                    searchPlaceholder="Buscar unidades..."
                    renderOption={(option, isSelected) => (
                      <div className={`flex justify-between items-center py-2 px-3 ${isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''}`}>
                        <span className="font-medium text-sm">{option.label}</span>
                        {option.description && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {option.description}
                          </span>
                        )}
                      </div>
                    )}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="vence">Fecha de vencimiento</Label>
                  <Input
                    id="vence"
                    type="date"
                    value={data.fecha_vencimiento ?? ''}
                    onChange={e=>setData('fecha_vencimiento', e.target.value)}
                    className={getInputClassName('fecha_vencimiento')}
                  />
                  {errors.fecha_vencimiento && <div className="text-red-500 text-sm mt-1">⚠️ {errors.fecha_vencimiento}</div>}
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <Checkbox id="activo" checked={!!data.activo} onCheckedChange={(v)=>setData('activo', !!v)} />
                  <Label htmlFor="activo">Activo</Label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Sección de imágenes mejorada */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Foto de perfil</Label>
                    <div className="relative">
                      {data.perfil?.url ? (
                        <div className="space-y-3">
                          <div className="relative inline-block">
                            <img
                              src={data.perfil.url}
                              alt="Perfil del producto"
                              className="w-32 h-32 object-cover rounded-lg border shadow-md"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0"
                              onClick={() => setData('perfil', null)}
                            >
                              ✕
                            </Button>
                          </div>
                          <div className="text-sm text-gray-600">
                            Imagen actual del producto
                          </div>
                          <div className="relative inline-block">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="relative overflow-hidden"
                            >
                              <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Cambiar imagen
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={e => setPerfil(e.target.files?.[0] ?? null)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </Button>
                          </div>
                        </div>
                      ) : data.perfil?.file ? (
                        <div className="space-y-3">
                          <div className="relative inline-block">
                            <img
                              src={URL.createObjectURL(data.perfil.file)}
                              alt="Vista previa"
                              className="w-32 h-32 object-cover rounded-lg border shadow-md"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0"
                              onClick={() => setData('perfil', null)}
                            >
                              ✕
                            </Button>
                          </div>
                          <div className="text-sm text-gray-600">
                            Nueva imagen seleccionada
                          </div>
                          <div className="relative inline-block">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="relative overflow-hidden"
                            >
                              <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Cambiar imagen
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={e => setPerfil(e.target.files?.[0] ?? null)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors relative cursor-pointer">
                          <div className="space-y-3">
                            <div className="mx-auto w-12 h-12 text-gray-400">
                              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-700">Selecciona una imagen</p>
                              <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 4MB</p>
                            </div>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => setPerfil(e.target.files?.[0] ?? null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Galería de imágenes</Label>
                      <div className="relative">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="relative overflow-hidden"
                        >
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Agregar imágenes
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={e => addGaleria(e.target.files)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </Button>
                      </div>
                    </div>

                    {data.galeria && data.galeria.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {data.galeria.map((img, i) => (
                          <div key={i} className="relative group">
                            <div className="aspect-square overflow-hidden rounded-lg border bg-gray-100">
                              {img.url ? (
                                <img
                                  src={img.url}
                                  alt={`Galería ${i + 1}`}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                              ) : img.file ? (
                                <img
                                  src={URL.createObjectURL(img.file)}
                                  alt={`Vista previa ${i + 1}`}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="absolute -top-2 -right-2 rounded-full w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              onClick={() => removeGaleria(i)}
                            >
                              ✕
                            </Button>
                            <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              Imagen {i + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
                        <div className="space-y-3">
                          <div className="mx-auto w-10 h-10 text-gray-300">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-500">No hay imágenes en la galería</p>
                          <p className="text-xs text-gray-400">Usa el botón "Agregar imágenes" para subir fotos adicionales</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sección de precios mejorada con tipos */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Precios *</Label>
                      <Button type="button" size="sm" onClick={addPrecio} variant="outline">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Añadir precio
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {data.precios.map((p, i) => {
                        const tipoPrecioInfo = getTipoPrecioInfo(p.tipo_precio || 'venta');
                        const esGanancia = tipoPrecioInfo?.es_ganancia ?? false;
                        const gananciaInfo = esGanancia && precioCosto > 0 ?
                          calcularGanancia(p.monto, precioCosto) : null;

                        return (
                          <div key={i} className={`rounded-lg p-4 border-2 ${
                            errors[`precios.${i}.nombre`] || errors[`precios.${i}.monto`]
                              ? 'border-red-200 bg-red-50'
                              : tipoPrecioInfo?.color === 'blue'
                                ? 'border-blue-200 bg-blue-50'
                                : tipoPrecioInfo?.color === 'green'
                                ? 'border-green-200 bg-green-50'
                                : 'border-gray-200 bg-gray-50'
                          }`}>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Label className="text-sm font-medium">
                                    {tipoPrecioInfo?.label || 'Precio'}
                                  </Label>
                                  {tipoPrecioInfo && (
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      tipoPrecioInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                      tipoPrecioInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                                      tipoPrecioInfo.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                                      tipoPrecioInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                                      tipoPrecioInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {tipoPrecioInfo.es_ganancia ? '💰 Ganancia' : '📦 Costo Base'}
                                    </span>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removePrecio(i)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  🗑️
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-sm font-medium mb-1 block">
                                    Tipo de precio *
                                  </Label>
                                  <select
                                    value={p.tipo_precio_id || 2}
                                    onChange={(e) => setPrecio(i, 'tipo_precio_id', Number(e.target.value))}
                                    className="w-full border rounded-md h-9 px-2 bg-white text-sm"
                                  >
                                    {tipos_precio.map(tipo => (
                                      <option key={tipo.value} value={tipo.value}>
                                        {tipo.icono} {tipo.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium mb-1 block">Nombre personalizado</Label>
                                  <Input
                                    value={p.nombre || ''}
                                    onChange={(e) => setPrecio(i, 'nombre', e.target.value)}
                                    placeholder={tipoPrecioInfo?.label || "Nombre opcional"}
                                    className="text-sm"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-3 items-end">
                                <div className="col-span-2">
                                  <Label className="text-sm font-medium mb-1 block">Monto *</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={p.monto === 0 ? '' : p.monto}
                                    onChange={(e) => setPrecio(i, 'monto', e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    onBlur={(e) => {
                                      if (e.target.value === '') {
                                        setPrecio(i, 'monto', 0);
                                      }
                                    }}
                                    className={`text-sm ${errors[`precios.${i}.monto`] ? 'border-red-500' : ''}`}
                                    placeholder="0.00"
                                  />
                                  {errors[`precios.${i}.monto`] && (
                                    <div className="text-red-500 text-xs mt-1">⚠️ {errors[`precios.${i}.monto`]}</div>
                                  )}
                                </div>
                                <div>
                                  <Label className="text-sm font-medium mb-1 block">Moneda</Label>
                                  <select
                                    className="w-full border rounded-md h-9 px-2 bg-white text-sm"
                                    value={p.moneda || 'BOB'}
                                    onChange={(e) => setPrecio(i, 'moneda', e.target.value)}
                                  >
                                    <option value="BOB">BOB</option>
                                    <option value="USD">USD</option>
                                  </select>
                                </div>
                              </div>

                              {/* Información de ganancia */}
                              {gananciaInfo && (
                                <div className="bg-green-50 border border-green-200 rounded p-3 mt-3">
                                  <div className="text-sm text-green-800">
                                    <div className="font-medium mb-1">💹 Análisis de Ganancia:</div>
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                      <div>
                                        <span className="font-medium">Ganancia:</span>
                                        <span className={`ml-1 ${gananciaInfo.ganancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {gananciaInfo.ganancia.toFixed(2)} BOB
                                        </span>
                                      </div>
                                      <div>
                                        <span className="font-medium">Porcentaje:</span>
                                        <span className={`ml-1 ${gananciaInfo.porcentaje >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {gananciaInfo.porcentaje.toFixed(1)}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Códigos de barra</Label>
                      <Button type="button" size="sm" onClick={addCodigo} variant="outline">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Añadir código
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {data.codigos.map((c, i) => (
                        <div key={i} className={`rounded-lg p-4 border-2 ${c.es_principal ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Label className="text-sm font-medium">Código de barras</Label>
                                {c.es_principal && (
                                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                                    Principal
                                  </span>
                                )}
                                {c.tipo && (
                                  <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                                    {c.tipo}
                                  </span>
                                )}
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => removeCodigo(i)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                🗑️
                              </Button>
                            </div>
                            <Input
                              value={c.codigo}
                              onChange={(e) => setCodigo(i, e.target.value)}
                              placeholder="Ingresa código EAN, UPC, etc. (opcional)"
                              className="text-sm font-mono"
                            />
                            {!c.codigo && i === 0 && (
                              <p className="text-xs text-gray-500">
                                💡 Si no ingresa un código, se usará automáticamente el ID del producto
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                      <p className="font-medium text-blue-800">ℹ️ Información sobre códigos de barra:</p>
                      <ul className="mt-1 space-y-1 text-blue-700">
                        <li>• Los códigos de barra son opcionales al crear un producto</li>
                        <li>• Si no se proporciona ningún código, se usará el ID del producto automáticamente</li>
                        <li>• El primer código ingresado será marcado como principal</li>
                        <li>• Puedes agregar múltiples códigos por producto si es necesario</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </form>
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
                className="min-w-[120px]"
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </span>
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
