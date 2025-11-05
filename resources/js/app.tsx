import '../css/app.css';
import 'react-toastify/dist/ReactToastify.css';
import 'leaflet/dist/leaflet.css';

// ✅ Polyfill para Socket.IO - definir global en navegador
if (typeof (globalThis as any).global === 'undefined') {
    (globalThis as any).global = globalThis;
}

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import { initializeTheme } from '@/presentation/hooks/use-appearance';
import { configureAxios } from '@/infrastructure/config/axios.config';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Configurar axios con interceptadores para autenticación
configureAxios();

createInertiaApp({
    title: (title) => title ? `${title} - ${appName}` : appName,
    resolve: (name) => resolvePageComponent(`./presentation/pages/${name}.tsx`, import.meta.glob('./presentation/pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <App {...props} />
                <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="light"
                />
            </>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
