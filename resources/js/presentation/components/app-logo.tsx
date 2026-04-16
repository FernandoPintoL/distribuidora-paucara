import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';

export default function AppLogo() {
    const { auth } = usePage().props as any;

    // ✅ MEJORADO (2026-04-16): Obtener empresa del usuario dinámicamente
    // El logo y nombre cambian según la empresa a la que pertenece el usuario
    const empresa = useMemo(() => {
        if (auth?.user?.empresa) {
            return {
                nombre: auth.user.empresa.nombre_comercial || auth.user.empresa.razon_social || 'Sin empresa',
                logo: auth.user.empresa.logo_principal || auth.user.empresa.logo_compacto || '/logo.svg'
            };
        }
        // Fallback a variables de entorno si no hay empresa
        return {
            nombre: import.meta.env.VITE_LOGO_ALT || 'Distribuidora Paucara',
            logo: import.meta.env.VITE_LOGO_SVG || '/logo.svg'
        };
    }, [auth?.user?.empresa]);

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <img src={empresa.logo} alt={empresa.nombre} className="h-12 w-auto object-contain" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">{empresa.nombre}</span>
            </div>
        </>
    );
}
