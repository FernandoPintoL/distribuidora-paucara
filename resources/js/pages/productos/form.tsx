 import { Head, Link, useForm, router } from '@inertiajs/react';
 import Step1DatosProducto from './steps/Step1DatosProducto';
 import Step2PreciosCodigos from './steps/Step2PreciosCodigos';
 import Step3Almacenes from './steps/Step3Almacenes';
 import Step4Imagenes from './steps/Step4Imagenes';
 import { useEffect, useState } from 'react';
 import AppLayout from '@/layouts/app-layout';
 import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { useEntitySelect } from '@/hooks/use-search-select';
 import NotificationService from '@/services/notification.service';
 import productosService from '@/services/productos.service';
 import type { Producto, ProductoFormData, Precio, Imagen, StockAlmacen, CodigoBarra } from '@/domain/productos';
 import type { TipoPrecio } from '@/domain/tipos-precio';

 interface ProductoFormPageProps {
   producto?: Producto | null;
   categorias: {id: number; nombre: string}[];
   marcas: {id: number; nombre: string}[];
   unidades: {id: number; codigo: string; nombre: string}[];
   almacenes?: { id: number; nombre: string }[];
   tipos_precio: TipoPrecio[];
   configuraciones_ganancias?: { porcentaje_interes_general?: number; tipo_precio_ganancia_id?: number };
   historial_precios?: import('@/domain/productos').HistorialPrecio[];
 }

 // Estado del formulario tipado para evitar 'any' implícitos
 // Usamos Omit para quitar propiedades heredadas que permiten null (perfil) y
 // redefinirlas con tipos más estrictos que cumplen la restricción de useForm.
 type ProductoFormState = Omit<ProductoFormData, 'perfil'|'galeria'|'precios'|'codigos'|'almacenes'> & {
   perfil?: { file?: File | null; url?: string };
   galeria: Imagen[];
   precios: Precio[];
   codigos: { codigo: string; es_principal?: boolean; tipo?: string }[];
   almacenes: StockAlmacen[];
 };

 // Precios por defecto mejorados con tipos usando IDs
 // Porcentaje de interés global recibido por props (opcional) se mostrará en la UI y puede ayudar a calcular precios
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
   perfil: undefined,
   galeria: [],
   precios: [
     { nombre: 'Precio Costo', monto: 0, tipo_precio_id: 1 },
     { nombre: 'Precio Venta', monto: 0, tipo_precio_id: 2 },
   ],
   codigos: [{ codigo: '' }],
   almacenes: [],
 };

 export default function ProductoForm({ producto, categorias, marcas, unidades, tipos_precio, configuraciones_ganancias, almacenes, historial_precios }: ProductoFormPageProps) {
   // Normalizadores para compatibilidad: el backend puede enviar {id,nombre,...} o {value,label,...}
   /*const tpId = (tp: any) => Number((tp?.id ?? tp?.value) ?? 0);
   const tpNombre = (tp: any) => String(tp?.nombre ?? tp?.label ?? '');
   const tpIcono = (tp: any) => (tp?.configuracion?.icono ?? tp?.icono ?? '');
   const tpEsGanancia = (tp: any) => Boolean(tp?.es_ganancia);
   const tpEsBase = (tp: any) => Boolean(tp?.es_precio_base);
   const tpColor = (tp: any) => String(tp?.color ?? '');*/
   const isEditing = !!producto?.id;
   const porcentajeInteres = Number(configuraciones_ganancias?.porcentaje_interes_general ?? 0);
   // Estado para controlar pasos del formulario (wizard)
   const [step, setStep] = useState<number>(1);
   const totalSteps = 4;
   const DRAFT_KEY = 'producto_form_draft_v1';

   // Configurar hooks de búsqueda para cada entidad
   const categoriasSelect = useEntitySelect(categorias);
   const marcasSelect = useEntitySelect(marcas);
   const unidadesSelect = useEntitySelect(unidades, {
     searchFields: ['nombre', 'codigo'],
     descriptionField: 'codigo'
   });
   // Select para almacenes reales
   const almacenesSelect = useEntitySelect(almacenes || [], { searchFields: ['nombre'] });

   const { data, setData, processing, errors, recentlySuccessful, clearErrors } = useForm<any>(
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
       perfil: producto.perfil ?? undefined,
       galeria: producto.galeria ?? [],
       precios: producto.precios?.length ? producto.precios : initialProductoData.precios,
       codigos: producto.codigos?.length ? producto.codigos : [{ codigo: '' }],
       almacenes: (producto as any)?.almacenes?.length ? (producto as any).almacenes : [],
     } : (initialProductoData as unknown as ProductoFormState)
   );

   // Prefill almacenes por defecto al crear (no editar)
   useEffect(() => {
     if (isEditing) { return; }
     if ((data.almacenes || []).length > 0) { return; }
     if (!Array.isArray(almacenes) || almacenes.length === 0) { return; }
     const prefilled = almacenes.map(a => ({
       almacen_id: a.id,
       almacen_nombre: a.nombre,
       stock: 0,
       lote: '',
       fecha_vencimiento: ''
     })) as StockAlmacen[];
     setData((prev: any) => ({ ...(prev as any), almacenes: prefilled } as any));
   }, [isEditing, almacenes, data.almacenes]);

   // Autosave: restaurar borrador en carga inicial (solo creación)
   useEffect(() => {
     if (typeof window === 'undefined') { return; }
     if (isEditing) { return; }
     try {
       const raw = localStorage.getItem(DRAFT_KEY);
       if (!raw) { return; }
       const draftUnknown = JSON.parse(raw) as unknown;
       if (!draftUnknown || typeof draftUnknown !== 'object') { return; }
       const draft = draftUnknown as Record<string, unknown>;
       const nextStep = Number((draft.step as number | string | undefined) ?? 1);
       if (nextStep >= 1 && nextStep <= totalSteps) {
         setStep(nextStep);
       }
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
         NotificationService.info('Se restauró tu borrador del producto.');
       }
     } catch (e) {
       console.warn('Borrador inválido, se ignora.', e);
     }
   }, []);

   // Autosave: guardar borrador al cambiar datos o paso (solo creación)
   useEffect(() => {
     if (typeof window === 'undefined') { return; }
     if (isEditing) { return; }
     try {
       const payload = { step, data, ts: Date.now() };
       const replacer = (key: string, value: unknown) => (key === 'file' ? undefined : value);
       // Omitimos cualquier propiedad llamada "file" (File/Blob) para evitar errores de serialización
       localStorage.setItem(
         DRAFT_KEY,
         JSON.stringify(payload, replacer as unknown as (this: unknown, key: string, value: unknown) => unknown)
       );
     } catch (err) {
       console.warn('No se pudo guardar el borrador', err);
     }
   }, [data, step, isEditing]);

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
       // Mostrar el primer error específico del backend de forma segura
       const firstErrorKey = Object.keys(errors)[0];
       const firstError = errors[firstErrorKey] as unknown;
       if (firstError) {
         const message = Array.isArray(firstError) ? (firstError as unknown[]).map(x => String(x)).join(', ') : String(firstError);
         NotificationService.error(`Error en ${firstErrorKey}: ${message}`);
       }
     }
   }, [errors]);

   const submit = async (e: React.FormEvent) => {
     e.preventDefault();

     // Si no es el último paso, validar y avanzar al siguiente
     // Evitar instanciaciones de tipos profundas en clearErrors
     (clearErrors as unknown as () => void)();
     if (step < totalSteps) {
       // Validaciones por paso
       if (step === 1) {
         if (!data.nombre || !String(data.nombre).trim()) {
           NotificationService.error('El nombre del producto es requerido');
           return;
         }
       }
       if (step === 2) {
         const preciosValidos = (data.precios || []).filter((p: Precio) => Number(p.monto) > 0 && p.nombre && String(p.nombre).trim());
         if (preciosValidos.length === 0) {
           NotificationService.warning('Debe agregar al menos un precio válido con nombre');
           return;
         }
       }

       setStep(step + 1);
       window.scrollTo({ top: 0, behavior: 'smooth' });
       return;
     }

     // Último paso: realizar validaciones finales y enviar
     // Validaciones básicas finales
     if (!data.nombre || !String(data.nombre).trim()) {
       NotificationService.error('El nombre del producto es requerido');
       setStep(1);
       return;
     }
     const preciosValidos = (data.precios || []).filter((p: Precio) => Number(p.monto) > 0 && p.nombre && String(p.nombre).trim());
     if (preciosValidos.length === 0) {
       NotificationService.warning('Debe agregar al menos un precio válido con nombre');
       setStep(2);
       return;
     }

     // Validación de fechas de vencimiento (si existen)
     if ((data.almacenes || []).length > 0) {
       const isIsoDate = (s: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(s);
       const today = new Date();
       today.setHours(0,0,0,0);
       for (let i = 0; i < (data.almacenes || []).length; i++) {
         const a = (data.almacenes as StockAlmacen[])[i];
         const fv = a?.fecha_vencimiento ? String(a.fecha_vencimiento) : '';
         if (fv) {
           if (!isIsoDate(fv)) {
             NotificationService.error(`La fecha de vencimiento en la fila ${i + 1} (${a.almacen_nombre || 'almacén'}) no tiene formato válido (YYYY-MM-DD).`);
             setStep(3);
             window.scrollTo({ top: 0, behavior: 'smooth' });
             return;
           }
           const d = new Date(`${fv}T00:00:00`);
           d.setHours(0,0,0,0);
           if (isNaN(d.getTime()) || d < today) {
             NotificationService.error(`La fecha de vencimiento en la fila ${i + 1} (${a.almacen_nombre || 'almacén'}) no puede ser pasada.`);
             setStep(3);
             window.scrollTo({ top: 0, behavior: 'smooth' });
             return;
           }
         }
       }
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
     data.galeria?.forEach((img: Imagen, i: number) => {
       if (img.file) {
         formData.append(`galeria[${i}]`, img.file);
       }
     });

     // Precios (solo los válidos)
     preciosValidos.forEach((p: Precio, i: number) => {
       formData.append(`precios[${i}][nombre]`, p.nombre?.trim() || '');
       formData.append(`precios[${i}][monto]`, String(p.monto));
       if (p.tipo_precio_id != null) {
         formData.append(`precios[${i}][tipo_precio_id]`, String(p.tipo_precio_id));
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

     // Almacenes (normalizar y unificar por almacén+lote)
     const mapKey = (a: StockAlmacen) => `${Number(a.almacen_id || 0)}|${String((a.lote || '').toLowerCase())}`;
     const tmp: Record<string, { almacen_id: number; almacen_nombre?: string; stock: number; lote?: string; fecha_vencimiento?: string }>= {};
     (data.almacenes || []).forEach((a: StockAlmacen) => {
       const idNum = Number(a?.almacen_id || 0);
       if (!idNum) return;
       const key = mapKey(a);
       if (!tmp[key]) {
         tmp[key] = {
           almacen_id: idNum,
           almacen_nombre: a.almacen_nombre,
           stock: Number(a.stock || 0),
           lote: a.lote ? String(a.lote).trim() : undefined,
           fecha_vencimiento: a.fecha_vencimiento || undefined,
         };
       } else {
         tmp[key].stock += Number(a.stock || 0);
         // mantener la fecha más próxima (string comparación YYYY-MM-DD ok para proximidad lexicográfica)
         if (a.fecha_vencimiento) {
           tmp[key].fecha_vencimiento = tmp[key].fecha_vencimiento
             ? (tmp[key].fecha_vencimiento < a.fecha_vencimiento ? tmp[key].fecha_vencimiento : a.fecha_vencimiento)
             : a.fecha_vencimiento;
         }
       }
     });
     const almacenesNormalizados = Object.values(tmp);
     almacenesNormalizados.forEach((a, i) => {
       formData.append(`almacenes[${i}][almacen_id]`, String(a.almacen_id));
       if (a.almacen_nombre) formData.append(`almacenes[${i}][almacen_nombre]`, String(a.almacen_nombre));
       formData.append(`almacenes[${i}][stock]`, String(a.stock ?? 0));
       if (a.lote) formData.append(`almacenes[${i}][lote]`, String(a.lote));
       if (a.fecha_vencimiento) formData.append(`almacenes[${i}][fecha_vencimiento]`, String(a.fecha_vencimiento));
     });

     let savingToast: string | undefined;
     const options: any = {
       forceFormData: true,
       onStart: () => {
         savingToast = NotificationService.loading('Guardando producto...');
       },
       onSuccess: () => {
         // NotificationService se maneja en el useEffect
         // limpiar draft en localStorage
         try {
           localStorage.removeItem(DRAFT_KEY);
         } catch (err) {
           // prevenir fallo si el storage no está disponible (por ejemplo en SSR)
           console.warn('No se pudo eliminar draft:', err);
         }
         // Redirigir al índice al finalizar correctamente
         router.visit(productosService.indexUrl());
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

   // Almacenes helpers
   const addAlmacen = (prefill?: Partial<StockAlmacen>) => {
     const next = (data.almacenes || []).slice();
     const base = { almacen_id: '', almacen_nombre: '', stock: 0, lote: '', fecha_vencimiento: '' } as StockAlmacen;
     next.push({ ...base, ...(prefill as any) } as StockAlmacen);
     setData((prev: any) => ({ ...(prev as any), almacenes: next } as any));
     NotificationService.info(prefill ? 'Lote agregado' : 'Entrada de almacén agregada');
   };

   const setAlmacen = (i: number, key: keyof StockAlmacen, value: number | string | undefined) => {
     const next = [...(data.almacenes || [])];
     next[i] = { ...next[i], [key]: value } as StockAlmacen;
     // Si actualizamos almacen_id y hay opción disponible, sincronizar nombre
     if (key === 'almacen_id') {
       const opt = (almacenesSelect.filteredOptions as { value: number | string; label: string }[]).find((o) => String(o.value) === String(value));
       if (opt) next[i].almacen_nombre = opt.label as string;
     }
     setData((prev: any) => ({ ...(prev as any), almacenes: next } as any));
   };

   const removeAlmacen = async (i: number) => {
     if (!(data.almacenes || []).length) return;
     const confirmed = await NotificationService.confirm('¿Eliminar esta entrada de almacén?', { confirmText: 'Eliminar', cancelText: 'Cancelar' });
     if (confirmed) {
       setData((prev: any) => ({
         ...(prev as any),
         almacenes: (((prev as any)?.almacenes) || []).filter((_: unknown, idx: number) => idx !== i)
       } as any));
     }
   };

   // Precios y códigos: funciones reales usadas por Step2
   const setPrecios = (precios: Precio[]) => {
     setData((prev: any) => ({ ...(prev as any), precios } as any));
   };

   const setPrecio = (i: number, key: string, value: string | number) => {
     const next = [...data.precios];
     // Mantener el valor tal cual (string o number) para no romper el input controlado
     next[i] = { ...(next[i] as any), [key]: value } as Precio;
     setData((prev: any) => ({ ...(prev as any), precios: next } as any));
   };

   // Agregar/Quitar un tipo de precio por checkbox
   const toggleTipoPrecio = (tipoId: number, checked: boolean) => {
     const exists = (data.precios || []).some((p: Precio) => Number(p.tipo_precio_id) === Number(tipoId));
     if (checked && !exists) {
       const tipo = (tipos_precio || []).find(t => Number((t as any)?.id ?? (t as any)?.value) === Number(tipoId));
       const nuevo = { nombre: (tipo as any)?.nombre || 'Precio', monto: 0, tipo_precio_id: tipoId } as Precio;
       setData((prev: any) => ({ ...(prev as any), precios: ([...data.precios, nuevo] as unknown) as Precio[] } as any));
     } else if (!checked && exists) {
       setData((prev: any) => ({
         ...(prev as any),
         precios: (((prev as any)?.precios) || []).filter((p: any) => Number(p.tipo_precio_id) !== Number(tipoId))
       } as any));
     }
   };

   const setCodigo = (i: number, value: string) => {
     const next = [...(data.codigos || [])];
     next[i] = { ...(next[i] || {}), codigo: value } as any;
     setData((prev: any) => ({ ...(prev as any), codigos: next } as any));
   };

   const addCodigo = () => {
     setData((prev: any) => ({
       ...(prev as any),
       codigos: ([...((prev as any)?.codigos || []), { codigo: '' }] as any)
     } as any));
     NotificationService.info('Código agregado. Ingresa el código de barras.');
   };

   const removeCodigo = async (i: number) => {
     const items = (data.codigos || []);
     if (items.length <= 1) {
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
       setData((prev: any) => ({
         ...(prev as any),
         codigos: ((((prev as any)?.codigos) || []).filter((_: unknown, idx: number) => idx !== i) as any)
       } as any));
       NotificationService.success('Código eliminado');
     }
   };

   const setPerfil = (file: File | undefined) => {
     setData((prev: any) => ({ ...(prev as any), perfil: file ? { file } : undefined } as any));
     if (file) {
       NotificationService.success('Imagen de perfil seleccionada');
     }
   };

   const addGaleria = (files: FileList | null) => {
     if (!files || files.length === 0) return;

     const imgs = Array.from(files).map(f => ({ file: f } as Imagen));
     setData((prev: any) => ({ ...(prev as any), galeria: ([...(((prev as any)?.galeria) || []), ...imgs] as any) } as any));
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
       setData((prev: any) => ({
         ...(prev as any),
         galeria: ((((prev as any)?.galeria) || []).filter((_: unknown, idx: number) => idx !== i) as any)
       } as any));
       NotificationService.success('Imagen eliminada de la galería');
     }
   };

   // Función para obtener el color del borde según si hay error
   const getInputClassName = (fieldName: keyof typeof errors) => {
     return errors[fieldName]
       ? "border-red-500 focus:border-red-500 focus:ring-red-500"
       : "border-input focus:border-ring focus:ring-ring";
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
               {/* Barra de progreso simple */}
               <div className="flex items-center gap-2">
                 {[1,2,3,4].map(s => (
                   <div key={s} className={`px-3 py-1 rounded-full text-xs font-medium ${step===s ? 'bg-blue-600 text-white' : 'bg-secondary text-muted-foreground'}`}>
                     Paso {s}
                   </div>
                 ))}
               </div>

               {/* STEP 1: Datos del producto */}
               {step === 1 && (
                <Step1DatosProducto
                  {...({
                    data: data as any,
                    errors: errors as any,
                    categoriasOptions: categoriasSelect.filteredOptions,
                    marcasOptions: marcasSelect.filteredOptions,
                    unidadesOptions: unidadesSelect.filteredOptions,
                    setData: setData as any,
                    getInputClassName: getInputClassName as any,
                  } as any)}
                />
               )}

               <div className="space-y-6">
                 {/* STEP 2: Precios y códigos */}
                 {step === 2 && (
                  <Step2PreciosCodigos
                   data={{ precios: data.precios, codigos: data.codigos }}
                   errors={errors}
                   tipos_precio={tipos_precio}
                   porcentajeInteres={porcentajeInteres}
                   precioCosto={data.precios?.find((p : Precio) => Number(p.tipo_precio_id) === 1)?.monto ?? 0}
                   addPrecio={() => {}}
                   removePrecio={() => {}}
                   setPrecio={setPrecio}
                   setPrecios={setPrecios}
                   toggleTipoPrecio={toggleTipoPrecio}
                   getTipoPrecioInfo={() => undefined}
                   calcularGanancia={() => ({ ganancia: 0, porcentaje: 0 })}
                   addCodigo={addCodigo}
                   removeCodigo={removeCodigo}
                   setCodigo={setCodigo}
                   historial_precios={historial_precios}
                 />
               )}

                 {/* STEP 4: Imágenes (mostramos sólo en step 4) */}
                 {step === 4 && (
                  <Step4Imagenes
                    data={{ perfil: data.perfil, galeria: data.galeria }}
                    setPerfil={setPerfil}
                    addGaleria={addGaleria}
                    removeGaleria={removeGaleria}
                  />
                )}
               </div>

               {/* Paso 3: Ajustes de almacén y stock */}
               {step === 3 && (
                <Step3Almacenes
                  data={{ almacenes: data.almacenes || [] }}
                  almacenesOptions={almacenesSelect.filteredOptions}
                  addAlmacen={addAlmacen}
                  setAlmacen={setAlmacen}
                  removeAlmacen={removeAlmacen}
                />
              )}
             </form>
           </CardContent>

           <CardFooter>
             <div className="flex justify-between w-full">
               <Button asChild variant="outline" disabled={processing}>
                 <Link href={productosService.indexUrl()}>
                   {processing ? 'Procesando...' : 'Cancelar'}
                 </Link>
               </Button>
               <div className="flex items-center gap-2">
                 {step > 1 && (
                   <Button type="button" variant="outline" onClick={() => setStep(step - 1)} disabled={processing}>
                     Volver
                   </Button>
                 )}
                 <Button
                   type="submit"
                   disabled={processing}
                   onClick={submit}
                   className="min-w-[140px]"
                 >
                   {processing ? (
                     <span className="flex items-center gap-2">Procesando...</span>
                   ) : (
                     step < totalSteps ? 'Siguiente' : 'Guardar producto'
                   )}
                 </Button>
               </div>
             </div>
           </CardFooter>
         </Card>
       </div>
     </AppLayout>
   );
 }
