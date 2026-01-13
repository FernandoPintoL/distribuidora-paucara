<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('titulo', 'Ticket')</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Courier New', 'Courier', monospace;

            font-size: {
                    {
                    $empresa->configuracion_impresion['tamaño_fuente_ticket'] ?? '8px'
                }
            }

            ;
            line-height: 1.3;

            padding: {
                    {
                    $empresa->configuracion_impresion['margen_ticket'] ?? '2mm'
                }
            }

            ;
            color: #000;
        }

        .ticket {
            width: 100%;
        }

        /* Utilidades de texto */
        .center {
            text-align: center;
        }

        .right {
            text-align: right;
        }

        .left {
            text-align: left;
        }

        .bold {
            font-weight: bold;
        }

        /* Header del ticket */
        .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 5px;
        }

        .logo {
            max-width: 60px;
            max-height: 60px;
            margin: 0 auto 5px;
            display: block;
        }

        .empresa-nombre {
            font-size: 12px;
            font-weight: bold;
            margin: 3px 0;
        }

        .empresa-info {
            font-size: 7px;
            margin: 1px 0;
        }

        /* Separadores */
        .separador {
            border-top: 1px dashed #000;
            margin: 8px 0;
        }

        .separador-doble {
            border-top: 2px solid #000;
            margin: 8px 0;
        }

        .separador-simple {
            border-top: 1px solid #000;
            margin: 5px 0;
        }

        /* Tablas de items */
        table.items {
            width: 100%;
            margin: 5px 0;
            font-size: 7px;
            border-collapse: collapse;
        }

        table.items td {
            padding: 2px 0;
            vertical-align: top;
        }

        table.items .item-nombre {
            font-weight: bold;
        }

        table.items .item-detalle {
            font-size: 6px;
            color: #333;
        }

        /* Totales */
        .totales {
            margin-top: 10px;
            font-size: 9px;
        }

        .totales table {
            width: 100%;
        }

        .totales table td {
            padding: 2px 0;
        }

        .totales .total-final {
            font-size: 11px;
            font-weight: bold;
            margin-top: 5px;
            padding-top: 5px;
            border-top: 1px solid #000;
        }

        /* Información del documento */
        .documento-info {
            font-size: 8px;
            margin: 5px 0;
        }

        .documento-info p {
            margin: 2px 0;
        }

        .documento-titulo {
            font-size: 10px;
            font-weight: bold;
            text-align: center;
            margin: 5px 0;
        }

        .documento-numero {
            text-align: center;
            font-size: 9px;
            margin: 2px 0;
        }

        /* Footer */
        .footer {
            text-align: center;
            margin-top: 15px;
            font-size: 7px;
            border-top: 1px dashed #000;
            padding-top: 5px;
        }

        .footer p {
            margin: 2px 0;
        }

        /* Observaciones */
        .observaciones {
            margin-top: 8px;
            padding-top: 5px;
            border-top: 1px dashed #000;
            font-size: 7px;
        }

        .observaciones strong {
            display: block;
            margin-bottom: 3px;
        }

        @yield('estilos-adicionales')

    </style>
</head>
<body>
    <div class="ticket">
        {{-- Header compacto --}}
        <div class="header">
            @if(!empty($logo_principal_base64))
            <img src="{{ $logo_principal_base64 }}" class="logo" alt="{{ $empresa->nombre_comercial }}">
            @elseif($empresa->logo_compacto)
            <img src="{{ $empresa->logo_compacto }}" class="logo" alt="{{ $empresa->nombre_comercial }}">
            @elseif($empresa->logo_principal)
            <img src="{{ $empresa->logo_principal }}" class="logo" alt="{{ $empresa->nombre_comercial }}">
            @endif
            <div class="empresa-nombre">{{ $empresa->nombre_comercial }}</div>
            <div class="empresa-info">NIT: {{ $empresa->nit }}</div>
            <div class="empresa-info">{{ $empresa->direccion }}</div>
            <div class="empresa-info">{{ $empresa->ciudad }} - {{ $empresa->pais }}</div>
            @if($empresa->telefono)
            <div class="empresa-info">Tel: {{ $empresa->telefono }}</div>
            @endif
        </div>

        {{-- Contenido específico del documento --}}
        @yield('contenido')

        {{-- Footer --}}
        <div class="footer">
            @if(!empty($logo_footer_base64))
            <div style="margin-bottom: 5px;">
                <img src="{{ $logo_footer_base64 }}" alt="Logo Footer" style="max-width: 50px; max-height: 25px; object-fit: contain;">
            </div>
            @elseif(!empty($logo_principal_base64))
            <div style="margin-bottom: 5px;">
                <img src="{{ $logo_principal_base64 }}" alt="Logo Footer" style="max-width: 50px; max-height: 25px; object-fit: contain;">
            </div>
            @elseif($empresa->logo_footer)
            <div style="margin-bottom: 5px;">
                <img src="{{ $empresa->logo_footer }}" alt="Logo Footer" style="max-width: 50px; max-height: 25px; object-fit: contain;">
            </div>
            @elseif($empresa->logo_principal)
            <div style="margin-bottom: 5px;">
                <img src="{{ $empresa->logo_principal }}" alt="Logo Footer" style="max-width: 50px; max-height: 25px; object-fit: contain;">
            </div>
            @endif
            @if($empresa->mensaje_footer)
            <div>{{ $empresa->mensaje_footer }}</div>
            @endif
            <div style="margin-top: 3px;">
                {{ $fecha_impresion->format('d/m/Y H:i') }}
                @if($usuario)
                - {{ $usuario->name }}
                @endif
            </div>
        </div>
    </div>
</body>
</html>
