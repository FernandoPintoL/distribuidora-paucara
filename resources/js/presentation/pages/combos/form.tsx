import { useState, useMemo, useCallback, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { toast } from 'react-toastify';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Textarea } from '@/presentation/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/presentation/components/ui/table';
import { Badge } from '@/presentation/components/ui/badge';
import { Trash2, ArrowLeft, Search, X } from 'lucide-react';
import { Link, router } from '@inertiajs/react';
import * as routes from '@/routes/combos';

interface Producto {
  id: number;
  nombre: string;
  sku: string;
  precio_venta: number;
  precios: Array<{
    id: number;
    tipo_precio_id: number;
    nombre: string;
    precio: number;
    tipoPrecio: {
      id: number;
      nombre: string;
      codigo: string;
    };
  }>;
  tipo_precio_id_recomendado?: number;
}

interface ComboItem {
  producto_id: number;
  producto_nombre?: string;
  producto_sku?: string;
  cantidad: number;
  precio_unitario: number;
  tipo_precio_id?: number;
  tipo_precio_nombre?: string;
  precios?: Array<{
    id: number;
    tipo_precio_id: number;
    nombre: string;
    precio: number;
    tipoPrecio: {
      id: number;
      nombre: string;
      codigo: string;
    };
  }>;
}

interface TipoPrecio {
  id: number;
  nombre: string;
  codigo: string;
}

interface Combo {
  id: number;
  nombre: string;
  descripcion?: string;
  precio_venta: number;
  activo: boolean;
  items: ComboItem[];
}

interface FormProps {
  combo?: Combo;
  tipos_precio: TipoPrecio[];
}

export default function ComboForm({ combo, tipos_precio }: FormProps) {
  console.log('Tipos de precio:', tipos_precio);
  const isEditing = !!combo;
  const [items, setItems] = useState<ComboItem[]>(
    combo?.items?.map(item => ({
      ...item,
      cantidad: parseFloat(item.cantidad.toString()),
      precio_unitario: parseFloat(item.precio_unitario.toString()),
    })) || []
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Producto[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [precioUnitario, setPrecioUnitario] = useState(0);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Función para normalizar items y asegurar que todos los números sean tipo number
  const normalizeItems = useCallback((itemsToNormalize: ComboItem[]) => {
    return itemsToNormalize.map(item => ({
      ...item,
      cantidad: parseFloat(item.cantidad.toString()),
      precio_unitario: parseFloat(item.precio_unitario.toString()),
    }));
  }, []);

  const { data, setData, post, put, processing, errors } = useForm({
    sku: combo?.sku || '',
    nombre: combo?.nombre || '',
    descripcion: combo?.descripcion || '',
    precio_venta: combo?.precio_venta || 0,
    items: normalizeItems(items),
  });

  // Buscar productos
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setLoadingSearch(true);
    try {
      const response = await fetch(`/api/productos/buscar?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      const results = data.data || [];
      console.log('Resultados de búsqueda:', results);
      setSearchResults(results);
      setShowResults(true);

      // Si hay exactamente 1 resultado, agregarlo automáticamente a la tabla
      if (results.length === 1) {
        const producto = results[0];
        setTimeout(() => {
          // Verificar que el producto no esté ya en el combo
          if (!items.some(item => item.producto_id === producto.id)) {
            setSelectedProducto(producto);
            setSearchQuery(producto.nombre);
            setShowResults(false);
            setSearchResults([]);
            // Cargar precio de venta del producto
            setPrecioUnitario(producto.precio_venta || 0);

            // Agregar automáticamente a la tabla después de un pequeño delay
            setTimeout(() => {
              const newComboItem: ComboItem = {
                producto_id: producto.id,
                producto_nombre: producto.nombre,
                producto_sku: producto.sku,
                cantidad: 1,
                precio_unitario: producto.precio_venta || 0,
                tipo_precio_id: producto.tipo_precio_id_recomendado,
                tipo_precio_nombre: producto.precios?.find(
                  p => p.tipo_precio_id === producto.tipo_precio_id_recomendado
                )?.tipoPrecio?.nombre,
                precios: producto.precios,
              };
              const updatedItemsFromSearch = [...items, newComboItem];
              setItems(updatedItemsFromSearch);
              setData('items', normalizeItems(updatedItemsFromSearch));
              setSelectedProducto(null);
              setSearchQuery('');
              setCantidad(1);
              setPrecioUnitario(0);
            }, 200);
          } else {
            alert('Este producto ya está en el combo');
          }
        }, 300);
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  }, [items]);

  const handleSelectProducto = (producto: Producto) => {
    // Verificar que el producto no esté ya en el combo
    if (items.some(item => item.producto_id === producto.id)) {
      alert('Este producto ya está en el combo');
      return;
    }

    // Agregar directamente a la tabla
    const newComboItem: ComboItem = {
      producto_id: producto.id,
      producto_nombre: producto.nombre,
      producto_sku: producto.sku,
      cantidad: 1,
      precio_unitario: producto.precio_venta || 0,
      tipo_precio_id: producto.tipo_precio_id_recomendado,
      tipo_precio_nombre: producto.precios?.find(
        p => p.tipo_precio_id === producto.tipo_precio_id_recomendado
      )?.tipoPrecio?.nombre,
      precios: producto.precios,
    };

    const updatedItems = [...items, newComboItem];
    setItems(updatedItems);
    setData('items', normalizeItems(updatedItems));

    // Limpiar la búsqueda
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
    setSelectedProducto(null);
    setCantidad(1);
    setPrecioUnitario(0);
  };

  const handleAddItem = () => {
    if (!selectedProducto) {
      alert('Selecciona un producto');
      return;
    }
    if (cantidad <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }
    if (items.some(item => item.producto_id === selectedProducto.id)) {
      alert('Este producto ya está en el combo');
      return;
    }

    const newComboItem: ComboItem = {
      producto_id: selectedProducto.id,
      producto_nombre: selectedProducto.nombre,
      producto_sku: selectedProducto.sku,
      cantidad,
      precio_unitario: precioUnitario || selectedProducto.precio_venta || 0,
      tipo_precio_id: selectedProducto.tipo_precio_id_recomendado,
      tipo_precio_nombre: selectedProducto.precios?.find(
        p => p.tipo_precio_id === selectedProducto.tipo_precio_id_recomendado
      )?.tipoPrecio?.nombre,
      precios: selectedProducto.precios,
    };

    const updatedItems = [...items, newComboItem];
    setItems(updatedItems);
    setData('items', normalizeItems(updatedItems));
    setSelectedProducto(null);
    setSearchQuery('');
    setCantidad(1);
    setPrecioUnitario(0);
  };

  const handleRemoveItem = (productoId: number) => {
    const updatedItems = items.filter(item => item.producto_id !== productoId);
    setItems(updatedItems);
    setData('items', normalizeItems(updatedItems));
  };

  const handleUpdateTipoPrecio = (productoId: number, tipoPrecioId: number | undefined) => {
    const updatedItems = items.map(item => {
      if (item.producto_id === productoId) {
        // Buscar el precio para este tipo de precio en el array precios del producto
        const precioParaTipo = item.precios?.find(p => p.tipo_precio_id === tipoPrecioId)?.precio;
        const tipoPrecio = tipos_precio.find(tp => tp.id === tipoPrecioId);
        return {
          ...item,
          tipo_precio_id: tipoPrecioId,
          tipo_precio_nombre: tipoPrecio?.nombre,
          precio_unitario: precioParaTipo !== undefined ? parseFloat(precioParaTipo.toString()) : parseFloat(item.precio_unitario.toString()),
        };
      }
      return item;
    });
    setItems(updatedItems);
    setData('items', normalizeItems(updatedItems));
  };

  const handleUpdateCantidad = (productoId: number, nuevaCantidad: number) => {
    const updatedItems = items.map(item => {
      if (item.producto_id === productoId) {
        return {
          ...item,
          cantidad: nuevaCantidad,
        };
      }
      return item;
    });
    setItems(updatedItems);
    setData('items', normalizeItems(updatedItems));
  };

  const handleUpdatePrecioUnitario = (productoId: number, nuevoPrecio: number) => {
    const updatedItems = items.map(item => {
      if (item.producto_id === productoId) {
        return {
          ...item,
          precio_unitario: nuevoPrecio,
        };
      }
      return item;
    });
    setItems(updatedItems);
    setData('items', normalizeItems(updatedItems));
  };

  const totalCosto = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + parseFloat(item.precio_unitario.toString()) * parseFloat(item.cantidad.toString());
    }, 0);
  }, [items]);

  // Auto-actualizar precio_venta con el totalCosto cuando items cambian
  // Solo si precio_venta es 0 o es igual al anterior totalCosto
  const [previousTotalCosto, setPreviousTotalCosto] = useState(0);

  useEffect(() => {
    if (items.length > 0) {
      // Si es la primera vez (precio_venta === 0) o si el precio_venta actual es igual al costo anterior,
      // actualizar al nuevo costo total
      const currentPrecioVenta = parseFloat(data.precio_venta.toString());
      if (currentPrecioVenta === 0 || Math.abs(currentPrecioVenta - previousTotalCosto) < 0.01) {
        setData('precio_venta', totalCosto);
      }
    }
    setPreviousTotalCosto(totalCosto);
  }, [totalCosto, items.length]);

  // Mostrar toasts para errores
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) => {
        if (typeof message === 'string') {
          toast.error(message, {
            position: 'top-right',
            autoClose: 4000,
          });
        }
      });
    }
  }, [errors]);

  const margen = useMemo(() => {
    if (!data.precio_venta || totalCosto === 0) return 0;
    return ((parseFloat(data.precio_venta.toString()) - totalCosto) / totalCosto) * 100;
  }, [data.precio_venta, totalCosto]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      toast.error('Debes agregar al menos un producto al combo', {
        position: 'top-right',
        autoClose: 4000,
      });
      return;
    }

    const formData = {
      ...data,
      items,
    };

    if (isEditing) {
      put(routes.update(combo.id).url, {
        data: formData,
        onSuccess: () => {
          toast.success('Combo actualizado exitosamente', {
            position: 'top-right',
            autoClose: 3000,
          });
        },
      });
    } else {
      post(routes.store().url, {
        data: formData,
        onSuccess: () => {
          toast.success('Combo creado exitosamente', {
            position: 'top-right',
            autoClose: 3000,
          });
        },
      });
    }
  };

  return (
    <AppLayout
      breadcrumbs={[
        { title: 'Dashboard', href: '#' },
        { title: 'Combos', href: routes.index().url },
        { title: isEditing ? 'Editar' : 'Crear', href: '#' },
      ]}
    >
      <div className="space-y-6 p-6">
        {/* Botón atrás */}
        <Link href={routes.index().url}>
          <Button variant="outline" className="gap-2">
            <ArrowLeft size={18} />
            Volver
          </Button>
        </Link>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sección: Información básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sku">SKU del Combo *</Label>
                <Input
                  id="sku"
                  value={data.sku}
                  onChange={(e) => setData('sku', e.target.value)}
                  placeholder="Ej: COMBO-001"
                  className={errors.sku ? 'border-red-500' : ''}
                />
                {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku}</p>}
              </div>

              <div>
                <Label htmlFor="nombre">Nombre del Combo *</Label>
                <Input
                  id="nombre"
                  value={data.nombre}
                  onChange={(e) => setData('nombre', e.target.value)}
                  placeholder="Ej: Pack Premium"
                  className={errors.nombre ? 'border-red-500' : ''}
                />
                {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
              </div>

              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={data.descripcion}
                  onChange={(e) => setData('descripcion', e.target.value)}
                  placeholder="Descripción del combo..."
                  rows={3}
                  className={errors.descripcion ? 'border-red-500' : ''}
                />
                {errors.descripcion && (
                  <p className="text-red-500 text-sm mt-1">{errors.descripcion}</p>
                )}
              </div>

              <div>
                <Label htmlFor="precio_venta">Precio de Venta *</Label>
                <Input
                  id="precio_venta"
                  type="number"
                  step="0.01"
                  value={data.precio_venta}
                  onChange={(e) => setData('precio_venta', e.target.value ? parseFloat(e.target.value) : 0)}
                  placeholder="0.00"
                  className={errors.precio_venta ? 'border-red-500' : ''}
                />
                {errors.precio_venta && (
                  <p className="text-red-500 text-sm mt-1">{errors.precio_venta}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sección: Buscar y agregar productos */}
          <Card>
            <CardHeader>
              <CardTitle>Agregar Productos al Combo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Búsqueda de producto */}
              <div>
                <Label htmlFor="buscar_producto">Buscar Producto (SKU, ID o Nombre) *</Label>
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={18} />
                      <Input
                        id="buscar_producto"
                        type="text"
                        placeholder="Escribe SKU, ID o nombre del producto..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSearch(searchQuery);
                          }
                        }}
                        onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                        className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('');
                            setShowResults(false);
                            setSearchResults([]);
                            setSelectedProducto(null);
                          }}
                          className="absolute right-3 top-3"
                        >
                          <X size={18} className="text-gray-400 dark:text-gray-500" />
                        </button>
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={() => handleSearch(searchQuery)}
                      disabled={loadingSearch || searchQuery.trim().length < 2}
                      className="gap-2"
                    >
                      <Search size={18} />
                      Buscar
                    </Button>
                  </div>

                  {/* Resultados de búsqueda */}
                  {showResults && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
                      {loadingSearch ? (
                        <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">Buscando...</div>
                      ) : searchResults.length > 0 ? (
                        <div>
                          {searchResults.map((producto) => (
                            <button
                              key={producto.id}
                              type="button"
                              onClick={() => handleSelectProducto(producto)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b dark:border-gray-700 last:border-b-0 flex justify-between items-center dark:text-gray-100"
                            >
                              <div>
                                <div className="font-medium text-sm">{producto.nombre}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">SKU: {producto.sku} | ID: {producto.id}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : searchQuery.trim().length >= 2 ? (
                        <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">No se encontraron productos</div>
                      ) : null}
                    </div>
                  )}
                </div>
                {selectedProducto && (
                  <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded flex justify-between items-center">
                    <div className="text-sm dark:text-green-200">
                      <span className="font-medium">{selectedProducto.nombre}</span>
                      <span className="text-gray-600 dark:text-gray-400"> • {selectedProducto.sku}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Cantidad y Precio unitario */}
              {selectedProducto && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cantidad">Cantidad *</Label>
                    <Input
                      id="cantidad"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="1"
                      value={cantidad}
                      onChange={(e) => setCantidad(parseFloat(e.target.value) || 1)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="precio_unitario">Precio Unitario *</Label>
                    <Input
                      id="precio_unitario"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={precioUnitario}
                      onChange={(e) => setPrecioUnitario(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full"
                      disabled={!selectedProducto}
                    >
                      Agregar a la Tabla
                    </Button>
                  </div>

                </div>

              )}


            </CardContent>
          </Card>

          {/* Sección: Tabla de productos */}
          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Productos del Combo ({items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-center">Precio Unit.</TableHead>
                        <TableHead className="text-center">Subtotal</TableHead>
                        <TableHead>Tipo de Precio</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item.producto_id}>
                          <TableCell>
                            <div className="font-medium text-sm">{item.producto_nombre}</div>
                            <div className="text-xs text-gray-500">{item.producto_sku}</div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={item.cantidad}
                              onChange={(e) =>
                                handleUpdateCantidad(item.producto_id, parseFloat(e.target.value) || 1)
                              }
                              className="w-20 px-2 py-1 text-sm"
                            />
                          </TableCell>
                          <TableCell className='text-center'>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={item.precio_unitario}
                              onChange={(e) =>
                                handleUpdatePrecioUnitario(item.producto_id, parseFloat(e.target.value) || 0)
                              }
                              className="w-24 px-2 py-1 text-sm"
                            />
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            Bs {(parseFloat(item.precio_unitario.toString()) * parseFloat(item.cantidad.toString())).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <select
                              value={item.tipo_precio_id || ''}
                              onChange={(e) =>
                                handleUpdateTipoPrecio(
                                  item.producto_id,
                                  e.target.value ? parseInt(e.target.value) : undefined
                                )
                              }
                              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-800 dark:text-gray-100"
                            >
                              <option value="">Sin especificar</option>
                              {tipos_precio.map((tipo) => (
                                <option key={tipo.id} value={tipo.id}>
                                  {tipo.nombre}
                                </option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.producto_id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={18} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sección: Resumen de precios */}
          {items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Precios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Costo Total Calculado:</span>
                  <span className="font-semibold dark:text-gray-100">Bs {totalCosto.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Precio de Venta:</span>
                  <span className="font-semibold dark:text-gray-100">Bs {typeof data.precio_venta === 'number' ? data.precio_venta.toFixed(2) : parseFloat(data.precio_venta.toString() || '0').toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 dark:text-gray-400">Margen de Ganancia:</span>
                  <Badge
                    variant={margen > 0 ? 'default' : margen < 0 ? 'destructive' : 'secondary'}
                  >
                    {margen.toFixed(2)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botones de acción */}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={processing}
              className="flex-1"
            >
              {processing ? 'Guardando...' : isEditing ? 'Actualizar Combo' : 'Crear Combo'}
            </Button>
            <Link href={routes.index().url} className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
