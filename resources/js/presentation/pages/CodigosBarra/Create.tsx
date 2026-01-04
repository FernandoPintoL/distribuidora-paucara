import React, { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Barcode, ArrowLeft } from 'lucide-react';

// Helper para generar rutas
const route = (name: string, params?: Record<string, unknown> | number | string) => {
  const routes: Record<string, string> = {
    'dashboard': '/dashboard',
    'productos.index': '/productos',
    'codigos-barra.index': '/codigos-barra',
    'codigos-barra.store': '/codigos-barra',
  };

  const baseRoute = routes[name] || '/';

  if (params && typeof params === 'object') {
    // Para parámetros de query
    const queryParams = new URLSearchParams(params as Record<string, string>).toString();
    return `${baseRoute}?${queryParams}`;
  }

  return baseRoute;
};

interface Producto {
    id: number;
    nombre: string;
    sku: string;
}

interface TipoCodigoBarraOption {
    label: string;
    value: string;
}

interface PageProps {
    producto: Producto;
    tipos: TipoCodigoBarraOption[];
    [key: string]: any;
}

export default function CodigosBarraCreate() {
    const { producto, tipos } = usePage<PageProps>().props;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data, setData, post, errors } = useForm({
        producto_id: producto.id,
        codigo: '',
        tipo: tipos[0]?.value || 'ean13',
        es_principal: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        post(route('codigos-barra.store'), {
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Dashboard', href: route('dashboard') },
            { title: 'Productos', href: route('productos.index') },
            { title: producto.nombre, href: '#' },
            { title: 'Códigos de Barra', href: route('codigos-barra.index', { producto_id: producto.id }) },
            { title: 'Crear Nuevo', href: '#' },
        ]}>
            <div className="space-y-6 p-6 max-w-2xl">
                {/* Encabezado */}
                <div>
                    <h1 className="text-4xl font-bold">🔲 Nuevo Código de Barra</h1>
                    <p className="text-gray-600 mt-2">
                        Registra un nuevo código de barra para {producto.nombre}
                    </p>
                </div>

                {/* Información del producto */}
                <Card>
                    <CardHeader>
                        <CardTitle>Información del Producto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Nombre</p>
                                <p className="text-lg font-semibold">{producto.nombre}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">SKU</p>
                                <p className="text-lg font-semibold">{producto.sku}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Formulario */}
                <Card>
                    <CardHeader>
                        <CardTitle>Datos del Código</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Código de Barra */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Código de Barra *
                                </label>
                                <div className="relative">
                                    <Barcode className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder="Ej: 1234567890123"
                                        value={data.codigo}
                                        onChange={(e) => setData('codigo', e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                {errors.codigo && (
                                    <p className="text-red-600 text-sm mt-1">{errors.codigo}</p>
                                )}
                            </div>

                            {/* Tipo de Código */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Tipo de Código *
                                </label>
                                <select
                                    value={data.tipo}
                                    onChange={(e) => setData('tipo', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {tipos.map((tipo) => (
                                        <option key={tipo.value} value={tipo.value}>
                                            {tipo.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.tipo && (
                                    <p className="text-red-600 text-sm mt-1">{errors.tipo}</p>
                                )}
                            </div>

                            {/* Es Principal */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="esPrincipal"
                                    checked={data.es_principal}
                                    onChange={(e) => setData('es_principal', e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300"
                                />
                                <label htmlFor="esPrincipal" className="ml-3 text-sm">
                                    Marcar como código principal
                                </label>
                            </div>

                            {/* Botones */}
                            <div className="flex gap-3 pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    asChild
                                >
                                    <a href={route('codigos-barra.index', { producto_id: producto.id })}>
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Cancelar
                                    </a>
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Guardando...' : 'Guardar Código'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
