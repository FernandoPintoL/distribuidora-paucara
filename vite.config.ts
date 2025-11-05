import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
        },
    },
    define: {
        // ✅ Polyfill para Socket.IO - define global en el navegador
        global: 'globalThis',
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    server: {
        // Listen on all network interfaces so you can access from other devices and any Wi‑Fi network
        host: "192.168.5.239", // Permite conexiones desde cualquier IP
        port: 5173,
        strictPort: false, // Permite usar puerto alternativo si está ocupado
        cors: true, // Habilita CORS para requests cross-origin
        hmr: {
            port: 5174, // Puerto separado para Hot Module Replacement
        },
    },
    esbuild: {
        jsx: 'automatic',
    },
    build: {
        // Optimizaciones para mejor rendimiento en red
        rollupOptions: {
            output: {
                manualChunks: {
                    // Separar librerías grandes en chunks independientes
                    'react-vendor': ['react', 'react-dom'],
                    'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
                    'maps-vendor': ['@react-google-maps/api', '@vis.gl/react-google-maps'],
                    'chart-vendor': ['chart.js', 'react-chartjs-2'],
                },
            },
        },
        chunkSizeWarningLimit: 1000,
        minify: 'esbuild', // Minificación más rápida
    },
    optimizeDeps: {
        // Pre-bundle dependencias para carga más rápida
        include: [
            'react',
            'react-dom',
            '@inertiajs/react',
            'lucide-react',
            'clsx',
            'tailwind-merge',
            'socket.io-client',  // ✅ Agregar Socket.IO para pre-bundling
        ],
        esbuildOptions: {
            define: {
                global: 'globalThis',  // ✅ Polyfill adicional para pre-bundling
            },
        },
    },
});
