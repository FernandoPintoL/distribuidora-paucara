<?php

return [
    /*
    |--------------------------------------------------------------------------
    | WebSocket Server URL
    |--------------------------------------------------------------------------
    |
    | URL del servidor WebSocket/Socket.IO para enviar notificaciones en tiempo real
    |
    */
    'url' => env('WEBSOCKET_URL', env('APP_ENV') === 'production' ? 'http://localhost:3001' : 'http://localhost:3000'),

    /*
    |--------------------------------------------------------------------------
    | WebSocket Server Timeout
    |--------------------------------------------------------------------------
    |
    | Tiempo máximo de espera para las peticiones HTTP al servidor WebSocket
    |
    */
    'timeout' => env('WEBSOCKET_TIMEOUT', 5),

    /*
    |--------------------------------------------------------------------------
    | WebSocket Enabled
    |--------------------------------------------------------------------------
    |
    | Habilitar o deshabilitar notificaciones WebSocket globalmente
    | Por defecto: deshabilitado en producción, habilitado en desarrollo
    |
    */
    'enabled' => env('WEBSOCKET_ENABLED', env('APP_ENV') !== 'production'),

    /*
    |--------------------------------------------------------------------------
    | WebSocket Debug Mode
    |--------------------------------------------------------------------------
    |
    | Habilitar logs detallados de las peticiones al servidor WebSocket
    |
    */
    'debug' => env('WEBSOCKET_DEBUG', false),

    /*
    |--------------------------------------------------------------------------
    | Retry Configuration
    |--------------------------------------------------------------------------
    |
    | Configuración para reintentos de peticiones fallidas
    |
    */
    'retry' => [
        'enabled' => env('WEBSOCKET_RETRY_ENABLED', true),
        'times' => env('WEBSOCKET_RETRY_TIMES', 2),
        'sleep' => env('WEBSOCKET_RETRY_SLEEP', 100), // milliseconds
    ],
];
