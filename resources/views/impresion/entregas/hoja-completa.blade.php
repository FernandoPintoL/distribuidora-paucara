@extends('impresion.layouts.base-a4')

@section('titulo', 'Entrega #' . $entrega->numero_entrega)

@section('estilos-adicionales')
<style>
    /* Contenedores principales */
    .documento-info {
        margin: 0;
        padding: 0;
        background: transparent;
        border: none;
        width: 100%;
        box-sizing: border-box;
    }

    /* Encabezados */
    h2 {
        font-size: 14px;
        margin-bottom: 8px;
        margin-top: 0;
        margin-left: 0;
        margin-right: 0;
        width: 100%;
    }

    h3 {
        font-size: 12px;
        margin-bottom: 8px;
        margin-top: 15px;
        margin-left: 0;
        margin-right: 0;
        width: 100%;
        color: #4F81BD;
        border-bottom: 2px solid #4F81BD;
        padding-bottom: 4px;
    }

    /* Tablas */
    table {
        width: 100%;
        box-sizing: border-box;
    }

    /* Grid layout para información */
    div[style*="display: grid"] {
        width: 100%;
    }

    div[style*="display: flex"] {
        width: 100%;
    }

    /* Bloques de contenido */
    > div {
        width: 100%;
        box-sizing: border-box;
    }

    /* Párrafos */
    p {
        margin-left: 0;
        margin-right: 0;
    }

    .text-right {
        text-align: right;
    }

    .text-center {
        text-align: center;
    }

    /* Totales */
    .totales {
        width: 100%;
    }

    .totales table {
        width: 100%;
        margin-left: 0;
    }

    /* Divisores */
    .separador {
        width: 100%;
        margin: 8px 0;
        border-top: 1px solid #ddd;
    }

    /* Notas y observaciones */
    p[style*="font-size: 9px; color: #666"] {
        width: 100%;
        box-sizing: border-box;
    }

    /* Información de venta */
    div[style*="margin-top: 15px; padding: 8px"] {
        width: 100%;
        box-sizing: border-box;
    }

    /* Grid de información */
    div[style*="display: grid; grid-template-columns"] {
        width: 100% !important;
        box-sizing: border-box !important;
    }

    /* Tablas de totales */
    .totales {
        width: 100%;
        margin-left: 0;
        margin-right: 0;
    }

    /* Asegurar que las tablas de productos ocupen 100% */
    table[style*="width: 100%"] {
        width: 100% !important;
        box-sizing: border-box !important;
    }

    /* Contenedor de separadores */
    div[style*="margin: 15px 0; border-top"] {
        width: 100%;
        box-sizing: border-box;
    }

    /* Información de venta */
    div[style*="margin-top: 15px; padding: 8px; background: #fafafa"] {
        width: 100%;
        box-sizing: border-box;
    }

    /* Secciones principales */
    div {
        max-width: none !important;
        overflow: visible !important;
    }

    /* Optimización de table-layout */
    table {
        table-layout: auto;
    }

    /* Overflow y word-break */
    td, th {
        overflow: visible !important;
        word-break: break-word;
    }

    /* Márgenes adicionales */
    * {
        margin-right: 0 !important;
    }
</style>
@endsection

@section('contenido')

{{-- 1. INFORMACIÓN DE LA ENTREGA --}}
@include('impresion.entregas.partials._informacion-entrega')

{{-- 2. LISTA GENÉRICA DE PRODUCTOS AGRUPADA --}}
@php
    $impresionService = app(\App\Services\ImpresionEntregaService::class);
    $productosGenerico = $impresionService->obtenerProductosAgrupados($entrega);
@endphp
@include('impresion.entregas.partials._lista-generica')

{{-- 3. COMPROBANTES DE VENTAS (al final para entrega al cliente) --}}
@include('impresion.entregas.partials._comprobantes-ventas')

@endsection
