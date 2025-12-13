import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './resources/js'),
        },
    },
    define: {
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
        // En producción, usar wayfinder con manejo de errores tolerante
        isProduction
            ? {
                name: 'wayfinder-safe',
                apply: 'build',
                enforce: 'pre',
                resolveId: () => null,
                load: () => null,
                transform: () => null,
            }
            : wayfinder({
                formVariants: true,
            }),
    ],
    /* server: {
        host: "10.210.173.22",
        port: 5173,
        strictPort: false,
        cors: true,
        hmr: {
            port: 5174,
        },
    }, */
    esbuild: {
        jsx: 'automatic',
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom'],
                    'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
                    'maps-vendor': ['@react-google-maps/api', '@vis.gl/react-google-maps'],
                    'chart-vendor': ['chart.js', 'react-chartjs-2'],
                },
            },
        },
        chunkSizeWarningLimit: 1000,
        minify: 'esbuild',
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            '@inertiajs/react',
            'lucide-react',
            'clsx',
            'tailwind-merge',
            'socket.io-client',
        ],
        esbuildOptions: {
            define: {
                global: 'globalThis',
            },
        },
    },
});
