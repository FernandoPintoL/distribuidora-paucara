'use client';

import { useEffect } from 'react';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { useWebSocket } from '@/application/hooks/use-websocket';
import { useAuth } from '@/application/hooks/use-auth';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function AppLayout({ children, breadcrumbs, ...props }: AppLayoutProps) {
    const { user } = useAuth();

    // ✅ Conectar al WebSocket automáticamente cuando el usuario está autenticado
    const { isConnected, error, subscribeTo, unsubscribeFrom } = useWebSocket({
        autoConnect: true  // Se conecta automáticamente si existe token en localStorage
    });

    // Logging de estado de conexión
    // ⚠️ IMPORTANTE: El servidor se encarga automáticamente de unir a los usuarios
    // a las salas correctas basado en su userType. No necesitamos subscribeTo() aquí.
    useEffect(() => {
        if (isConnected && user) {
            console.log(`✅ WebSocket conectado para usuario: ${user.name}`);
            console.log(`   ID: ${user.id}, Email: ${user.email}`);
            console.log(`✅ El servidor ha unido automáticamente al usuario a las salas correctas`);
            console.log(`   (client → sala 'clients')`);
        }
        if (error && user) {
            console.error(`❌ Error de conexión WebSocket: ${error}`);
        }
    }, [isConnected, error, user]);

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            {children}
            {/* React Hot Toast Container */}
            <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                containerClassName=""
                containerStyle={{}}
                toastOptions={{
                    // Define default options
                    className: '',
                    duration: 4000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                    },
                    // Default options for specific types
                    success: {
                        duration: 3000,
                        style: {
                            background: 'green',
                        },
                    },
                    error: {
                        duration: 5000,
                        style: {
                            background: 'red',
                        },
                    },
                }}
            />
        </AppLayoutTemplate>
    );
}
